import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Types for our database tables
interface Child {
  id: string;
  user_id: string;
  name: string;
  colour_hex: string;
  school_name?: string;
}

interface Event {
  id: string;
  user_id: string;
  child_id?: string;
  title: string;
  start_ts: string;
  end_ts: string;
  location?: string;
  prep_items?: string[];
  source_msg_id?: string;
  status: string;
}

interface InboundEmail {
  id: string;
  user_id: string;
  raw_body: string;
  subject: string;
  from_email: string;
  received_at: string;
  processed: boolean;
}

// Test user credentials
interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

describe('Row-Level Security Validation', () => {
  let adminClient: SupabaseClient;
  let testUser1: TestUser;
  let testUser2: TestUser;
  let testData: {
    user1Children: Child[];
    user1Events: Event[];
    user1Emails: InboundEmail[];
    user2Children: Child[];
    user2Events: Event[];
    user2Emails: InboundEmail[];
  };

  beforeAll(async () => {
    // Initialize admin client with service role key
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create test users
    testUser1 = await createTestUser('test-user-1@example.com', 'password123');
    testUser2 = await createTestUser('test-user-2@example.com', 'password123');

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data and users
    await cleanupTestData();
    await cleanupTestUsers();
  });

  beforeEach(async () => {
    // Ensure test data is fresh for each test
    await verifyTestDataIntegrity();
  });

  async function createTestUser(email: string, password: string): Promise<TestUser> {
    // Create user with admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    // Create client for this user
    const userClient = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Sign in the user
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    return {
      id: authData.user.id,
      email,
      password,
      client: userClient,
    };
  }

  async function setupTestData() {
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create children for user 1
    const { data: user1Children, error: childrenError1 } = await adminClient
      .from('children')
      .insert([
        {
          user_id: testUser1.id,
          name: 'Alice Test',
          colour_hex: '#FF6B9D',
          school_name: 'Test Elementary',
        },
        {
          user_id: testUser1.id,
          name: 'Bob Test',
          colour_hex: '#4ECDC4',
          school_name: 'Test Middle School',
        },
      ])
      .select();

    if (childrenError1) throw new Error(`Failed to create test children: ${childrenError1.message}`);

    // Create children for user 2
    const { data: user2Children, error: childrenError2 } = await adminClient
      .from('children')
      .insert([
        {
          user_id: testUser2.id,
          name: 'Charlie Test',
          colour_hex: '#FFE66D',
          school_name: 'Test High School',
        },
      ])
      .select();

    if (childrenError2) throw new Error(`Failed to create test children: ${childrenError2.message}`);

    // Create events for user 1
    const { data: user1Events, error: eventsError1 } = await adminClient
      .from('events')
      .insert([
        {
          user_id: testUser1.id,
          child_id: user1Children![0].id,
          title: 'Alice Soccer Practice',
          start_ts: tomorrow,
          end_ts: tomorrow,
          location: 'Test Sports Center',
          status: 'upcoming',
        },
        {
          user_id: testUser1.id,
          child_id: user1Children![1].id,
          title: 'Bob Piano Lesson',
          start_ts: tomorrow,
          end_ts: tomorrow,
          location: 'Test Music Studio',
          status: 'upcoming',
        },
      ])
      .select();

    if (eventsError1) throw new Error(`Failed to create test events: ${eventsError1.message}`);

    // Create events for user 2
    const { data: user2Events, error: eventsError2 } = await adminClient
      .from('events')
      .insert([
        {
          user_id: testUser2.id,
          child_id: user2Children![0].id,
          title: 'Charlie Drama Club',
          start_ts: tomorrow,
          end_ts: tomorrow,
          location: 'Test Theater',
          status: 'upcoming',
        },
      ])
      .select();

    if (eventsError2) throw new Error(`Failed to create test events: ${eventsError2.message}`);

    // Create inbound emails for user 1
    const { data: user1Emails, error: emailsError1 } = await adminClient
      .from('inbound_emails')
      .insert([
        {
          user_id: testUser1.id,
          raw_body: 'Soccer practice reminder for Alice',
          subject: 'Soccer Practice Tomorrow',
          from_email: 'coach@testsports.com',
          received_at: now,
          processed: false,
        },
      ])
      .select();

    if (emailsError1) throw new Error(`Failed to create test emails: ${emailsError1.message}`);

    // Create inbound emails for user 2
    const { data: user2Emails, error: emailsError2 } = await adminClient
      .from('inbound_emails')
      .insert([
        {
          user_id: testUser2.id,
          raw_body: 'Drama club meeting for Charlie',
          subject: 'Drama Club Meeting',
          from_email: 'director@testtheater.com',
          received_at: now,
          processed: false,
        },
      ])
      .select();

    if (emailsError2) throw new Error(`Failed to create test emails: ${emailsError2.message}`);

    testData = {
      user1Children: user1Children!,
      user1Events: user1Events!,
      user1Emails: user1Emails!,
      user2Children: user2Children!,
      user2Events: user2Events!,
      user2Emails: user2Emails!,
    };
  }

  async function verifyTestDataIntegrity() {
    // Verify all test data still exists
    const { data: children } = await adminClient.from('children').select('*').in('user_id', [testUser1.id, testUser2.id]);
    const { data: events } = await adminClient.from('events').select('*').in('user_id', [testUser1.id, testUser2.id]);
    const { data: emails } = await adminClient.from('inbound_emails').select('*').in('user_id', [testUser1.id, testUser2.id]);

    if (!children || children.length < 3) {
      throw new Error('Test data integrity check failed: Missing children records');
    }
    if (!events || events.length < 3) {
      throw new Error('Test data integrity check failed: Missing events records');
    }
    if (!emails || emails.length < 2) {
      throw new Error('Test data integrity check failed: Missing email records');
    }
  }

  async function cleanupTestData() {
    // Delete test data in correct order (respecting foreign keys)
    await adminClient.from('events').delete().in('user_id', [testUser1.id, testUser2.id]);
    await adminClient.from('children').delete().in('user_id', [testUser1.id, testUser2.id]);
    await adminClient.from('inbound_emails').delete().in('user_id', [testUser1.id, testUser2.id]);
  }

  async function cleanupTestUsers() {
    // Delete test users
    await adminClient.auth.admin.deleteUser(testUser1.id);
    await adminClient.auth.admin.deleteUser(testUser2.id);
  }

  describe('Children Table RLS', () => {
    test('should allow users to read only their own children', async () => {
      // User 1 should see their children
      const { data: user1Children, error: error1 } = await testUser1.client
        .from('children')
        .select('*');

      expect(error1).toBeNull();
      expect(user1Children).toHaveLength(2);
      expect(user1Children?.every(child => child.user_id === testUser1.id)).toBe(true);

      // User 2 should see their children
      const { data: user2Children, error: error2 } = await testUser2.client
        .from('children')
        .select('*');

      expect(error2).toBeNull();
      expect(user2Children).toHaveLength(1);
      expect(user2Children?.every(child => child.user_id === testUser2.id)).toBe(true);
    });

    test('should prevent users from accessing other users children', async () => {
      // User 1 should not see user 2's children
      const { data: crossAccessData } = await testUser1.client
        .from('children')
        .select('*')
        .eq('user_id', testUser2.id);

      expect(crossAccessData).toHaveLength(0);
    });

    test('should allow users to insert children for themselves', async () => {
      const newChild = {
        user_id: testUser1.id,
        name: 'Test Insert Child',
        colour_hex: '#123456',
        school_name: 'Test School',
      };

      const { data, error } = await testUser1.client
        .from('children')
        .insert(newChild)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].name).toBe('Test Insert Child');

      // Cleanup
      await adminClient.from('children').delete().eq('id', data![0].id);
    });

    test('should prevent users from inserting children for other users', async () => {
      const maliciousChild = {
        user_id: testUser2.id, // User 1 trying to create child for User 2
        name: 'Malicious Child',
        colour_hex: '#123456',
      };

      const { data, error } = await testUser1.client
        .from('children')
        .insert(maliciousChild)
        .select();

      // Should either fail with error or not return any data
      expect(data === null || data.length === 0).toBe(true);
    });

    test('should allow users to update their own children', async () => {
      const childToUpdate = testData.user1Children[0];
      const updatedName = 'Updated Alice Test';

      const { data, error } = await testUser1.client
        .from('children')
        .update({ name: updatedName })
        .eq('id', childToUpdate.id)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].name).toBe(updatedName);

      // Restore original name
      await adminClient
        .from('children')
        .update({ name: childToUpdate.name })
        .eq('id', childToUpdate.id);
    });

    test('should prevent users from updating other users children', async () => {
      const otherUserChild = testData.user2Children[0];

      const { data, error } = await testUser1.client
        .from('children')
        .update({ name: 'Hacked Name' })
        .eq('id', otherUserChild.id)
        .select();

      // Should not update anything
      expect(data === null || data.length === 0).toBe(true);

      // Verify the child wasn't actually updated
      const { data: verifyData } = await adminClient
        .from('children')
        .select('name')
        .eq('id', otherUserChild.id)
        .single();

      expect(verifyData?.name).toBe(otherUserChild.name);
    });

    test('should allow users to delete their own children', async () => {
      // Create a temporary child to delete
      const { data: tempChild } = await adminClient
        .from('children')
        .insert({
          user_id: testUser1.id,
          name: 'Temp Delete Child',
          colour_hex: '#123456',
        })
        .select()
        .single();

      const { error } = await testUser1.client
        .from('children')
        .delete()
        .eq('id', tempChild!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: verifyData } = await adminClient
        .from('children')
        .select('*')
        .eq('id', tempChild!.id);

      expect(verifyData).toHaveLength(0);
    });

    test('should prevent users from deleting other users children', async () => {
      const otherUserChild = testData.user2Children[0];

      const { error } = await testUser1.client
        .from('children')
        .delete()
        .eq('id', otherUserChild.id);

      // Verify the child still exists
      const { data: verifyData } = await adminClient
        .from('children')
        .select('*')
        .eq('id', otherUserChild.id);

      expect(verifyData).toHaveLength(1);
    });
  });

  describe('Events Table RLS', () => {
    test('should allow users to read only their own events', async () => {
      const { data: user1Events, error: error1 } = await testUser1.client
        .from('events')
        .select('*');

      expect(error1).toBeNull();
      expect(user1Events).toHaveLength(2);
      expect(user1Events?.every(event => event.user_id === testUser1.id)).toBe(true);

      const { data: user2Events, error: error2 } = await testUser2.client
        .from('events')
        .select('*');

      expect(error2).toBeNull();
      expect(user2Events).toHaveLength(1);
      expect(user2Events?.every(event => event.user_id === testUser2.id)).toBe(true);
    });

    test('should prevent cross-user event access', async () => {
      const { data: crossAccessData } = await testUser1.client
        .from('events')
        .select('*')
        .eq('user_id', testUser2.id);

      expect(crossAccessData).toHaveLength(0);
    });

    test('should allow users to create events for themselves', async () => {
      const newEvent = {
        user_id: testUser1.id,
        title: 'Test Event',
        start_ts: new Date().toISOString(),
        end_ts: new Date().toISOString(),
        status: 'upcoming',
      };

      const { data, error } = await testUser1.client
        .from('events')
        .insert(newEvent)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].title).toBe('Test Event');

      // Cleanup
      await adminClient.from('events').delete().eq('id', data![0].id);
    });

    test('should prevent users from creating events for other users', async () => {
      const maliciousEvent = {
        user_id: testUser2.id,
        title: 'Malicious Event',
        start_ts: new Date().toISOString(),
        end_ts: new Date().toISOString(),
        status: 'upcoming',
      };

      const { data, error } = await testUser1.client
        .from('events')
        .insert(maliciousEvent)
        .select();

      expect(data === null || data.length === 0).toBe(true);
    });

    test('should allow users to update their own events', async () => {
      const eventToUpdate = testData.user1Events[0];
      const updatedTitle = 'Updated Event Title';

      const { data, error } = await testUser1.client
        .from('events')
        .update({ title: updatedTitle })
        .eq('id', eventToUpdate.id)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].title).toBe(updatedTitle);

      // Restore original title
      await adminClient
        .from('events')
        .update({ title: eventToUpdate.title })
        .eq('id', eventToUpdate.id);
    });

    test('should prevent users from updating other users events', async () => {
      const otherUserEvent = testData.user2Events[0];

      const { data, error } = await testUser1.client
        .from('events')
        .update({ title: 'Hacked Event' })
        .eq('id', otherUserEvent.id)
        .select();

      expect(data === null || data.length === 0).toBe(true);

      // Verify the event wasn't updated
      const { data: verifyData } = await adminClient
        .from('events')
        .select('title')
        .eq('id', otherUserEvent.id)
        .single();

      expect(verifyData?.title).toBe(otherUserEvent.title);
    });

    test('should allow users to delete their own events', async () => {
      // Create a temporary event to delete
      const { data: tempEvent } = await adminClient
        .from('events')
        .insert({
          user_id: testUser1.id,
          title: 'Temp Delete Event',
          start_ts: new Date().toISOString(),
          end_ts: new Date().toISOString(),
          status: 'upcoming',
        })
        .select()
        .single();

      const { error } = await testUser1.client
        .from('events')
        .delete()
        .eq('id', tempEvent!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: verifyData } = await adminClient
        .from('events')
        .select('*')
        .eq('id', tempEvent!.id);

      expect(verifyData).toHaveLength(0);
    });

    test('should prevent users from deleting other users events', async () => {
      const otherUserEvent = testData.user2Events[0];

      const { error } = await testUser1.client
        .from('events')
        .delete()
        .eq('id', otherUserEvent.id);

      // Verify the event still exists
      const { data: verifyData } = await adminClient
        .from('events')
        .select('*')
        .eq('id', otherUserEvent.id);

      expect(verifyData).toHaveLength(1);
    });
  });

  describe('Inbound Emails Table RLS', () => {
    test('should allow users to read only their own emails', async () => {
      const { data: user1Emails, error: error1 } = await testUser1.client
        .from('inbound_emails')
        .select('*');

      expect(error1).toBeNull();
      expect(user1Emails).toHaveLength(1);
      expect(user1Emails?.every(email => email.user_id === testUser1.id)).toBe(true);

      const { data: user2Emails, error: error2 } = await testUser2.client
        .from('inbound_emails')
        .select('*');

      expect(error2).toBeNull();
      expect(user2Emails).toHaveLength(1);
      expect(user2Emails?.every(email => email.user_id === testUser2.id)).toBe(true);
    });

    test('should prevent cross-user email access', async () => {
      const { data: crossAccessData } = await testUser1.client
        .from('inbound_emails')
        .select('*')
        .eq('user_id', testUser2.id);

      expect(crossAccessData).toHaveLength(0);
    });

    test('should allow users to create emails for themselves', async () => {
      const newEmail = {
        user_id: testUser1.id,
        raw_body: 'Test email body',
        subject: 'Test Subject',
        from_email: 'test@example.com',
        received_at: new Date().toISOString(),
        processed: false,
      };

      const { data, error } = await testUser1.client
        .from('inbound_emails')
        .insert(newEmail)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].subject).toBe('Test Subject');

      // Cleanup
      await adminClient.from('inbound_emails').delete().eq('id', data![0].id);
    });

    test('should prevent users from creating emails for other users', async () => {
      const maliciousEmail = {
        user_id: testUser2.id,
        raw_body: 'Malicious email',
        subject: 'Malicious Subject',
        from_email: 'malicious@example.com',
        received_at: new Date().toISOString(),
        processed: false,
      };

      const { data, error } = await testUser1.client
        .from('inbound_emails')
        .insert(maliciousEmail)
        .select();

      expect(data === null || data.length === 0).toBe(true);
    });

    test('should allow users to update their own emails', async () => {
      const emailToUpdate = testData.user1Emails[0];

      const { data, error } = await testUser1.client
        .from('inbound_emails')
        .update({ processed: true })
        .eq('id', emailToUpdate.id)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].processed).toBe(true);

      // Restore original state
      await adminClient
        .from('inbound_emails')
        .update({ processed: false })
        .eq('id', emailToUpdate.id);
    });

    test('should prevent users from updating other users emails', async () => {
      const otherUserEmail = testData.user2Emails[0];

      const { data, error } = await testUser1.client
        .from('inbound_emails')
        .update({ processed: true })
        .eq('id', otherUserEmail.id)
        .select();

      expect(data === null || data.length === 0).toBe(true);

      // Verify the email wasn't updated
      const { data: verifyData } = await adminClient
        .from('inbound_emails')
        .select('processed')
        .eq('id', otherUserEmail.id)
        .single();

      expect(verifyData?.processed).toBe(otherUserEmail.processed);
    });
  });

  describe('RLS Policy Existence', () => {
    test('should have RLS enabled on all tables', async () => {
      const tables = ['children', 'events', 'inbound_emails'];
      
      for (const table of tables) {
        const { data, error } = await adminClient
          .from('pg_tables')
          .select('*')
          .eq('tablename', table)
          .eq('schemaname', 'public');

        expect(error).toBeNull();
        expect(data).toHaveLength(1);

        // Check if RLS is enabled (this requires a custom query)
        const { data: rlsData } = await adminClient.rpc('check_rls_enabled', { table_name: table });
        expect(rlsData).toBe(true);
      }
    });

    test('should have appropriate policies for each table', async () => {
      const expectedPolicies = [
        { table: 'children', operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
        { table: 'events', operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
        { table: 'inbound_emails', operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
      ];

      for (const { table, operations } of expectedPolicies) {
        for (const operation of operations) {
          const { data: policies } = await adminClient
            .from('pg_policies')
            .select('*')
            .eq('tablename', table)
            .eq('cmd', operation);

          expect(policies).toBeDefined();
          expect(policies!.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Anonymous Access Prevention', () => {
    test('should prevent anonymous access to all tables', async () => {
      const anonClient = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      const tables = ['children', 'events', 'inbound_emails'];

      for (const table of tables) {
        const { data, error } = await anonClient.from(table).select('*');
        
        // Should either return empty data or an error
        expect(data === null || data.length === 0).toBe(true);
      }
    });
  });

  describe('Service Role Bypass', () => {
    test('should allow service role to access all data', async () => {
      // Service role should be able to see all children
      const { data: allChildren, error: childrenError } = await adminClient
        .from('children')
        .select('*');

      expect(childrenError).toBeNull();
      expect(allChildren!.length).toBeGreaterThanOrEqual(3);

      // Service role should be able to see all events
      const { data: allEvents, error: eventsError } = await adminClient
        .from('events')
        .select('*');

      expect(eventsError).toBeNull();
      expect(allEvents!.length).toBeGreaterThanOrEqual(3);

      // Service role should be able to see all emails
      const { data: allEmails, error: emailsError } = await adminClient
        .from('inbound_emails')
        .select('*');

      expect(emailsError).toBeNull();
      expect(allEmails!.length).toBeGreaterThanOrEqual(2);
    });
  });
});