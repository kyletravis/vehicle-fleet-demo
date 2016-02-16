cf create-security-group open_all securityfile
cf bind-security-group open_all micropcf-org micropcf-space
cf bind-staging-security-group open_all
cf bind-running-security-group open_all
