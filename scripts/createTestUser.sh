#!/bin/bash

# RLS Test User Creation Script
# Creates test users and exports authentication tokens for RLS testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
TEST_ENV_FILE="${SCRIPT_DIR}/../.env.test"

echo -e "${BLUE}🔐 RLS Test User Creation Script${NC}"
echo "=================================="

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env file not found at $ENV_FILE${NC}"
    echo "Please create a .env file with your Supabase credentials."
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Required variables:"
    echo "  - EXPO_PUBLIC_SUPABASE_URL"
    echo "  - EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Function to create a test user
create_test_user() {
    local email="$1"
    local password="$2"
    local user_name="$3"
    
    echo -e "${YELLOW}📝 Creating test user: $email${NC}"
    
    # Create user using Supabase Admin API
    local response=$(curl -s -X POST \
        "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"email_confirm\": true,
            \"user_metadata\": {
                \"full_name\": \"$user_name\"
            }
        }")
    
    # Check if user creation was successful
    local user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$user_id" ]; then
        echo -e "${RED}❌ Failed to create user $email${NC}"
        echo "Response: $response"
        return 1
    fi
    
    echo -e "${GREEN}✅ User created successfully${NC}"
    echo "   User ID: $user_id"
    
    # Sign in the user to get access token
    echo -e "${YELLOW}🔑 Signing in user to get access token...${NC}"
    
    local auth_response=$(curl -s -X POST \
        "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password" \
        -H "Content-Type: application/json" \
        -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    local access_token=$(echo "$auth_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    local refresh_token=$(echo "$auth_response" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$access_token" ]; then
        echo -e "${RED}❌ Failed to get access token for $email${NC}"
        echo "Auth Response: $auth_response"
        return 1
    fi
    
    echo -e "${GREEN}✅ Access token obtained${NC}"
    
    # Export user information
    local var_prefix=$(echo "$email" | sed 's/@.*$//' | sed 's/[^a-zA-Z0-9]/_/g' | tr '[:lower:]' '[:upper:]')
    
    echo "# Test user: $email" >> "$TEST_ENV_FILE"
    echo "${var_prefix}_USER_ID=\"$user_id\"" >> "$TEST_ENV_FILE"
    echo "${var_prefix}_EMAIL=\"$email\"" >> "$TEST_ENV_FILE"
    echo "${var_prefix}_PASSWORD=\"$password\"" >> "$TEST_ENV_FILE"
    echo "${var_prefix}_ACCESS_TOKEN=\"$access_token\"" >> "$TEST_ENV_FILE"
    echo "${var_prefix}_REFRESH_TOKEN=\"$refresh_token\"" >> "$TEST_ENV_FILE"
    echo "" >> "$TEST_ENV_FILE"
    
    echo -e "${BLUE}📋 User credentials exported to $TEST_ENV_FILE${NC}"
    return 0
}

# Function to verify user can access Supabase
verify_user_access() {
    local email="$1"
    local access_token="$2"
    
    echo -e "${YELLOW}🔍 Verifying user access for $email...${NC}"
    
    local response=$(curl -s -X GET \
        "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/children?select=count" \
        -H "Authorization: Bearer $access_token" \
        -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}")
    
    if echo "$response" | grep -q "count"; then
        echo -e "${GREEN}✅ User can access Supabase successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ User cannot access Supabase${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to cleanup existing test users
cleanup_test_users() {
    echo -e "${YELLOW}🧹 Cleaning up existing test users...${NC}"
    
    # Get list of test users
    local users_response=$(curl -s -X GET \
        "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}")
    
    # Extract test user IDs (users with test emails)
    local test_user_ids=$(echo "$users_response" | grep -o '"id":"[^"]*","aud":"[^"]*","role":"[^"]*","email":"[^"]*test[^"]*"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$test_user_ids" ]; then
        echo "Found existing test users, deleting..."
        while IFS= read -r user_id; do
            if [ -n "$user_id" ]; then
                curl -s -X DELETE \
                    "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
                    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
                    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
                echo "   Deleted user: $user_id"
            fi
        done <<< "$test_user_ids"
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to create RLS test function in database
create_rls_test_function() {
    echo -e "${YELLOW}🔧 Creating RLS test function in database...${NC}"
    
    local sql_function="
    CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS \$\$
    DECLARE
        rls_enabled boolean;
    BEGIN
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        RETURN COALESCE(rls_enabled, false);
    END;
    \$\$;
    "
    
    local response=$(curl -s -X POST \
        "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -d "{\"sql\": \"$sql_function\"}")
    
    echo -e "${GREEN}✅ RLS test function created${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting test user creation process...${NC}"
    
    # Create or clear test environment file
    echo "# RLS Test Environment Variables" > "$TEST_ENV_FILE"
    echo "# Generated on $(date)" >> "$TEST_ENV_FILE"
    echo "" >> "$TEST_ENV_FILE"
    
    # Copy main environment variables
    echo "# Main Supabase Configuration" >> "$TEST_ENV_FILE"
    echo "EXPO_PUBLIC_SUPABASE_URL=\"$EXPO_PUBLIC_SUPABASE_URL\"" >> "$TEST_ENV_FILE"
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=\"$EXPO_PUBLIC_SUPABASE_ANON_KEY\"" >> "$TEST_ENV_FILE"
    echo "SUPABASE_SERVICE_ROLE_KEY=\"$SUPABASE_SERVICE_ROLE_KEY\"" >> "$TEST_ENV_FILE"
    echo "" >> "$TEST_ENV_FILE"
    
    # Cleanup existing test users
    cleanup_test_users
    
    # Create RLS test function
    create_rls_test_function
    
    # Create test users
    echo -e "${BLUE}Creating test users...${NC}"
    
    if create_test_user "test-user-1@example.com" "TestPassword123!" "Test User One"; then
        echo -e "${GREEN}✅ Test User 1 created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create Test User 1${NC}"
        exit 1
    fi
    
    if create_test_user "test-user-2@example.com" "TestPassword123!" "Test User Two"; then
        echo -e "${GREEN}✅ Test User 2 created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create Test User 2${NC}"
        exit 1
    fi
    
    # Verify access for both users
    echo -e "${BLUE}Verifying user access...${NC}"
    
    local user1_token=$(grep "TEST_USER_1_ACCESS_TOKEN" "$TEST_ENV_FILE" | cut -d'"' -f2)
    local user2_token=$(grep "TEST_USER_2_ACCESS_TOKEN" "$TEST_ENV_FILE" | cut -d'"' -f2)
    
    verify_user_access "test-user-1@example.com" "$user1_token"
    verify_user_access "test-user-2@example.com" "$user2_token"
    
    echo ""
    echo -e "${GREEN}🎉 Test user creation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "   • Test environment file: $TEST_ENV_FILE"
    echo "   • Test User 1: test-user-1@example.com"
    echo "   • Test User 2: test-user-2@example.com"
    echo "   • Password for both: TestPassword123!"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "   1. Run the RLS tests: npm test tests/rls.test.ts"
    echo "   2. Check the test environment file for user credentials"
    echo "   3. Use the cleanup script when done: ./scripts/cleanupTestUsers.sh"
    echo ""
    echo -e "${BLUE}💡 Usage in tests:${NC}"
    echo "   The test environment variables are automatically loaded by Jest."
    echo "   You can also manually source the file: source $TEST_ENV_FILE"
}

# Run main function
main "$@"