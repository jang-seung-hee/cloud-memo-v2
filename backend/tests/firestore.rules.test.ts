import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules Tests", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "cloud-memo-v2-test",
      firestore: {
        rules: fs.readFileSync("../security/firestore.rules", "utf8"),
        host: "localhost",
        port: 8090,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    
    // Seeding Mock Data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Alice Profile
      await setDoc(doc(db, "users/alice"), {
        email: "alice@test.com",
        displayName: "Alice Admin"
      });
      
      // Alice Public Profile
      await setDoc(doc(db, "users/alice/public/profile"), {
        displayName: "Alice",
        photoURL: "https://example.com/alice.jpg"
      });
      
      // Memos
      await setDoc(doc(db, "memos/memo_alice"), {
        userId: "alice",
        title: "Alice Private Memo",
        content: "Top Secret"
      });
      
      await setDoc(doc(db, "memos/memo_shared"), {
        userId: "alice",
        title: "Team Project",
        content: "Shared Info",
        sharedWithUids: ["bob"]
      });
    });
  });

  // [영역 1: 사용자 프로필 (Users)]
  test("1. Alice reads Alice profile (Allow)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(aliceDb, "users/alice")));
  });

  test("2. Bob reads Alice profile (Deny)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bobDb, "users/alice")));
  });

  test("3. Anyone reads Alice public profile (Allow)", async () => {
    const charlieDb = testEnv.authenticatedContext("charlie").firestore();
    await assertSucceeds(getDoc(doc(charlieDb, "users/alice/public/profile")));
  });

  test("4. Alice updates Alice public profile (Allow)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(updateDoc(doc(aliceDb, "users/alice/public/profile"), {
      displayName: "Alice Updated"
    }));
  });

  test("5. Bob updates Alice public profile (Deny)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertFails(updateDoc(doc(bobDb, "users/alice/public/profile"), {
      displayName: "Bob Hacked"
    }));
  });

  // [영역 2: 메모 관리 (Memos)]
  test("6. Alice creates valid memo (Allow)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(addDoc(collection(aliceDb, "memos"), {
      userId: "alice",
      title: "New Memo",
      content: "Hello World"
    }));
  });

  test("7. Alice creates memo with >100 char title (Deny)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertFails(addDoc(collection(aliceDb, "memos"), {
      userId: "alice",
      title: "A".repeat(101),
      content: "Too long"
    }));
  });

  test("8. Alice creates memo with empty title (Deny)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertFails(addDoc(collection(aliceDb, "memos"), {
      userId: "alice",
      title: "",
      content: "Empty"
    }));
  });

  test("9. Bob reads Alice private memo (Deny)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bobDb, "memos/memo_alice")));
  });

  test("10. Bob reads shared memo (Allow)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertSucceeds(getDoc(doc(bobDb, "memos/memo_shared")));
  });

  test("11. Alice updates memo title (Allow)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(updateDoc(doc(aliceDb, "memos/memo_alice"), {
      title: "Updated Title"
    }));
  });

  test("12. Shared Bob updates memo title (Deny) - Owner Only Rule", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    // 규칙상 공유 받은 자는 수정 가능하지만, 제목 수정 등에 대한 세밀한 로직 검증
    // 현재 규칙: (resource.data.userId == request.auth.uid && isValidString(... 'title' ...))
    // Bob은 sharedWith에 있더라도 request.auth.uid != resource.data.userId 이므로 title 수정 시도 시 실패해야 함
    await assertFails(updateDoc(doc(bobDb, "memos/memo_shared"), {
      title: "Hacked by Bob"
    }));
  });

  // [영역 3: 알림 및 Abuse 방지 (Notifications)]
  test("13. Owner Alice sends notification for her memo (Allow)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(addDoc(collection(aliceDb, "notifications"), {
      senderId: "alice",
      receiverId: "bob",
      memoId: "memo_alice",
      type: "share"
    }));
  });

  test("14. Non-owner Bob sends notification for Alice's memo (Deny)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertFails(addDoc(collection(bobDb, "notifications"), {
      senderId: "bob",
      receiverId: "charlie",
      memoId: "memo_alice",
      type: "fake_share"
    }));
  });

  test("15. Alice spoofs senderId as Bob (Deny)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertFails(addDoc(collection(aliceDb, "notifications"), {
      senderId: "bob",
      receiverId: "charlie",
      memoId: "memo_alice",
      type: "spoof"
    }));
  });

  test("16. Bob marks his notification as read (Allow)", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "notifications/notif_bob"), {
        receiverId: "bob",
        senderId: "alice",
        memoId: "memo_alice",
        isRead: false
      });
    });

    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertSucceeds(updateDoc(doc(bobDb, "notifications/notif_bob"), {
      isRead: true
    }));
  });

  test("17. Bob tries to change senderId of notification (Deny)", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await assertFails(updateDoc(doc(bobDb, "notifications/notif_bob"), {
      senderId: "hacker"
    }));
  });

  test("18. Unauthenticated user creates notification (Deny)", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(unauthDb, "notifications"), {
      senderId: "guest",
      receiverId: "bob",
      memoId: "memo_alice"
    }));
  });
});
