# Connect to EC2 instance and seed database

$instance_id = "i-0f73ae1ae2361763e"
$region = "sa-east-1"

Write-Host "========================================="
Write-Host "SISGEO Production Database Seed via EC2"
Write-Host "========================================="
Write-Host "Instance: $instance_id"
Write-Host "IP: 18.228.206.86"
Write-Host ""

# Create seed script
$seed_script = @'
#!/bin/bash

# Seed PostgreSQL via psql from EC2
export PGPASSWORD="postgres"

psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -U postgres \
  -d sigeo \
  -p 5432 \
  <<SQL
-- Seed database  
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

SELECT '✅ Users seeded!' as result;
SELECT COUNT(*) as total_users FROM users;
SELECT email, role FROM users ORDER BY created_at;
SQL
'@

Write-Host "Executing seed command via AWS Systems Manager..."
Write-Host ""

# Run command via SSM directly with JSON
$command = aws ssm send-command `
  --instance-ids $instance_id `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=['#!/bin/bash
export PGPASSWORD=postgres
psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -c \"INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES (\"\"0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b\"\", \"\"Admin Super\"\", \"\"admin@empresa.com\"\", \"\"Super Admin\"\", \"\"\$2a\$10\$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW\"\", NOW(), NOW()), (\"\"6a411dd7-e16e-4a0e-844e-151e30992385\"\", \"\"João Silva\"\", \"\"joao.ti@empresa.com\"\", \"\"Gestor\"\", \"\"\$2a\$10\$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i\"\", NOW(), NOW()), (\"\"b681c766-abaf-439f-8fb4-3c515decf6dd\"\", \"\"Maria Santos\"\", \"\"maria.vendas@empresa.com\"\", \"\"Gestor\"\", \"\"\$2a\$10\$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em\"\", NOW(), NOW()), (\"\"24aabcd2-bbe6-4501-8a61-b7113c9c83ae\"\", \"\"Carlos Funcionário\"\", \"\"carlos.funcionario@empresa.com\"\", \"\"Funcionário\"\", \"\"\$2a\$10\$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S\"\", NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET updated_at = NOW(); SELECT COUNT(*) as total_users FROM users;\"']" `
  --region $region `
  --output json | ConvertFrom-Json

$command_id = $command.Command.CommandId

Write-Host "Command ID: $command_id"
Write-Host ""
Write-Host "Waiting for command execution..."
Write-Host ""

# Wait for command to complete
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    
    $status = aws ssm get-command-invocation `
      --command-id $command_id `
      --instance-id $instance_id `
      --region $region `
      --query "Status" `
      --output text 2>$null
    
    if ($status -eq "Success") {
        Write-Host "✅ Command executed successfully!"
        
        $output = aws ssm get-command-invocation `
          --command-id $command_id `
          --instance-id $instance_id `
          --region $region `
          --query "StandardOutputContent" `
          --output text
        
        Write-Host ""
        Write-Host "Output:"
        Write-Host $output
        break
    } elseif ($status -eq "Failed") {
        Write-Host "❌ Command failed"
        
        $error_output = aws ssm get-command-invocation `
          --command-id $command_id `
          --instance-id $instance_id `
          --region $region `
          --query "StandardErrorContent" `
          --output text
        
        Write-Host ""
        Write-Host "Error:"
        Write-Host $error_output
        break
    } else {
        Write-Host "Waiting... Status: $status"
    }
}

Write-Host ""
Write-Host "========================================="
Write-Host "✨ Done! You can now login:"
Write-Host "========================================="
Write-Host ""
Write-Host "Email: admin@empresa.com"
Write-Host "Password: admin123"
