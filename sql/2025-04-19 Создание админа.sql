DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT primarykey INTO admin_role_id FROM roles WHERE name = 'SYSTEM_ADMIN' LIMIT 1;
    
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE login = 'admin') THEN
        INSERT INTO accounts (
            primarykey, 
            login, 
            email, 
            isemailverified, 
            password, 
            firstname, 
            lastname, 
            role, 
            createat, 
            editat, 
            status
        ) VALUES (
            gen_random_uuid(),
            'admin',
            'admin@example.com',
            true,
            '$2a$10$bjv.iQqoUUbz4TUyLqWqwe/4kdCpYg7G.vDOCiY7dGfOg/B6o9Aba',
            'System',
            'Administrator',
            admin_role_id,
            NOW(),
            NOW(),
            'ACTIVE'
        );
    END IF;
END $$;