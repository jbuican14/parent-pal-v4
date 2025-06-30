# RLS Validation Suite Documentation

This document explains how to run and understand the Row-Level Security (RLS) validation tests for the ParentPal application.

## Overview

The RLS validation suite ensures that your Supabase database security policies are properly configured and functioning as expected. It tests that users can only access their own data and cannot access or modify data belonging to other users.

## What is Row-Level Security (RLS)?

Row-Level Security is a PostgreSQL feature that allows you to control which rows in a table are visible or modifiable by different users. In our application, RLS ensures that:

- Users can only see their own children, events, and emails
- Users cannot access or modify data belonging to other users
- Anonymous users cannot access any protected data
- Service roles can bypass RLS for administrative operations

## Test Coverage

The RLS validation suite tests the following scenarios:

### Children Table
- ✅ Users can read only their own children
- ✅ Users cannot access other users' children
- ✅ Users can insert children for themselves
- ✅ Users cannot insert children for other users
- ✅ Users can update their own children
- ✅ Users cannot update other users' children
- ✅ Users can delete their own children
- ✅ Users cannot delete other users' children

### Events Table
- ✅ Users can read only their own events
- ✅ Users cannot access other users' events
- ✅ Users can create events for themselves
- ✅ Users cannot create events for other users
- ✅ Users can update their own events
- ✅ Users cannot update other users' events
- ✅ Users can delete their own events
- ✅ Users cannot delete other users' events

### Inbound Emails Table
- ✅ Users can read only their own emails
- ✅ Users cannot access other users' emails
- ✅ Users can create emails for themselves
- ✅ Users cannot create emails for other users
- ✅ Users can update their own emails
- ✅ Users cannot update other users' emails

### System-Level Tests
- ✅ RLS is enabled on all tables
- ✅ Appropriate policies exist for each operation
- ✅ Anonymous access is prevented
- ✅ Service role can bypass RLS

## Prerequisites

Before running the RLS tests, ensure you have:

1. **Environment Variables**: Properly configured `.env` file with:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Database Schema**: All required tables (`children`, `events`, `inbound_emails`) with proper RLS policies

3. **Test Dependencies**: Jest and related testing packages installed

## Running the Tests

### 1. Create Test Users

First, create test users for the RLS validation:

```bash
# Make the script executable
chmod +x scripts/createTestUser.sh

# Create test users
./scripts/createTestUser.sh
```

This script will:
- Create two test users with known credentials
- Generate access tokens for authentication
- Export user information to `.env.test`
- Verify that users can access the database

### 2. Run the RLS Tests

Execute the RLS validation suite:

```bash
# Run all RLS tests
npm test tests/rls.test.ts

# Run with verbose output
npm test tests/rls.test.ts -- --verbose

# Run specific test suites
npm test tests/rls.test.ts -- --testNamePattern="Children Table RLS"
npm test tests/rls.test.ts -- --testNamePattern="Events Table RLS"
npm test tests/rls.test.ts -- --testNamePattern="Inbound Emails Table RLS"
```

### 3. Cleanup (Optional)

After testing, you can clean up the test users:

```bash
# Create cleanup script
cat > scripts/cleanupTestUsers.sh << 'EOF'
#!/bin/bash
source .env
curl -X DELETE "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/$(grep TEST_USER_1_USER_ID .env.test | cut -d'"' -f2)" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
curl -X DELETE "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/$(grep TEST_USER_2_USER_ID .env.test | cut -d'"' -f2)" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
rm -f .env.test
EOF

chmod +x scripts/cleanupTestUsers.sh
./scripts/cleanupTestUsers.sh
```

## Understanding Test Results

### Successful Test Output

When RLS is properly configured, you should see output like:

```
✓ should allow users to read only their own children
✓ should prevent users from accessing other users children
✓ should allow users to insert children for themselves
✓ should prevent users from inserting children for other users
...
```

### Common Failure Scenarios

#### 1. RLS Not Enabled

```
❌ should prevent users from accessing other users children
   Expected: []
   Received: [{ id: "...", user_id: "other-user", ... }]
```

**Solution**: Enable RLS on the table:
```sql
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
```

#### 2. Missing Policies

```
❌ should allow users to read only their own children
   Error: new row violates row-level security policy
```

**Solution**: Create appropriate RLS policies:
```sql
-- Allow users to read their own children
CREATE POLICY "Users can read own children"
  ON children
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

#### 3. Incorrect Policy Logic

```
❌ should prevent users from inserting children for other users
   Expected: null or []
   Received: [{ id: "...", user_id: "other-user", ... }]
```

**Solution**: Review and fix policy conditions:
```sql
-- Ensure insert policy checks user_id
CREATE POLICY "Users can insert own children"
  ON children
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Test Configuration

### Environment Variables

The tests use the following environment variables:

```bash
# Main Supabase configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test user credentials (auto-generated)
TEST_USER_1_USER_ID=user-id-1
TEST_USER_1_EMAIL=test-user-1@example.com
TEST_USER_1_ACCESS_TOKEN=access-token-1
TEST_USER_2_USER_ID=user-id-2
TEST_USER_2_EMAIL=test-user-2@example.com
TEST_USER_2_ACCESS_TOKEN=access-token-2
```

### Test Data Structure

The tests create the following test data:

```typescript
// User 1 data
- 2 children (Alice Test, Bob Test)
- 2 events (Soccer Practice, Piano Lesson)
- 1 email (Soccer practice reminder)

// User 2 data
- 1 child (Charlie Test)
- 1 event (Drama Club)
- 1 email (Drama club meeting)
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   ```
   Error: Missing required environment variables
   ```
   - Ensure `.env` file exists with correct Supabase credentials
   - Run `createTestUser.sh` to generate test user credentials

2. **Test Users Already Exist**
   ```
   Error: User already registered
   ```
   - Run the cleanup script to remove existing test users
   - Or manually delete users from Supabase Auth dashboard

3. **Database Connection Issues**
   ```
   Error: Failed to connect to database
   ```
   - Verify Supabase URL and keys are correct
   - Check network connectivity
   - Ensure Supabase project is active

4. **RLS Policies Missing**
   ```
   Error: new row violates row-level security policy
   ```
   - Review your database schema
   - Ensure all required RLS policies are created
   - Check policy syntax and conditions

### Debugging Tips

1. **Enable Verbose Logging**:
   ```bash
   npm test tests/rls.test.ts -- --verbose --no-coverage
   ```

2. **Run Individual Tests**:
   ```bash
   npm test tests/rls.test.ts -- --testNamePattern="specific test name"
   ```

3. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication and database errors

4. **Verify RLS Policies**:
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';

   -- List all policies
   SELECT schemaname, tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

## Best Practices

1. **Run Tests Regularly**: Include RLS tests in your CI/CD pipeline
2. **Test After Schema Changes**: Always run RLS tests after modifying database schema
3. **Monitor Test Data**: Ensure test data is properly cleaned up
4. **Document Policy Changes**: Keep track of RLS policy modifications
5. **Test Edge Cases**: Consider testing with different user roles and permissions

## Integration with CI/CD

To integrate RLS tests into your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: RLS Tests
on: [push, pull_request]

jobs:
  rls-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Create test users
        run: ./scripts/createTestUser.sh
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Run RLS tests
        run: npm test tests/rls.test.ts
      
      - name: Cleanup test users
        run: ./scripts/cleanupTestUsers.sh
        if: always()
```

## Security Considerations

1. **Test Environment Isolation**: Use separate Supabase projects for testing
2. **Credential Management**: Never commit real credentials to version control
3. **Test Data Cleanup**: Always clean up test data after tests complete
4. **Access Control**: Limit who can run RLS tests in production environments
5. **Monitoring**: Monitor for unauthorized access attempts during testing

## Conclusion

The RLS validation suite is a critical component of your application's security testing strategy. Regular execution of these tests ensures that your data access controls remain effective and that user data stays protected.

For questions or issues with the RLS validation suite, please refer to the troubleshooting section or consult the Supabase documentation on Row-Level Security.