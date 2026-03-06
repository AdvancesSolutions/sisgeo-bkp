import boto3
import time
import json

print("=== SCRIPT AUTOMÁTICO DE CORREÇÃO ===\n")

# Clients AWS
ec2 = boto3.client('ec2', region_name='sa-east-1')
ssm = boto3.client('ssm', region_name='sa-east-1')

instance_id = 'i-0f73ae1ae2361763e'

# Comando para restart do container
restart_command = """#!/bin/bash
set -e
echo "Parando container..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

echo "Login no ECR..."
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin 320674390105.dkr.ecr.sa-east-1.amazonaws.com

echo "Pull da imagem..."
docker pull 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

echo "Iniciando container..."
docker run -d --name sigeo-api --restart always -p 3000:3000 \\
  -e NODE_ENV=production -e PORT=3000 \\
  -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \\
  -e DB_PORT=5432 -e DB_USER=postgres \\
  -e DB_PASSWORD=SigeoNewPass123! -e DB_NAME=sigeo \\
  -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede \\
  -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 \\
  -e CORS_ORIGIN=https://sigeo.advances.com.br \\
  320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

sleep 5
docker ps | grep sigeo
docker logs sigeo-api 2>&1 | tail -20
"""

print("Tentando Método 1: SSM Send Command...")
try:
    response = ssm.send_command(
        InstanceIds=[instance_id],
        DocumentName='AWS-RunShellScript',
        Parameters={'commands': restart_command.split('\n')}
    )
    command_id = response['Command']['CommandId']
    print(f"✓ Comando enviado: {command_id}")
    
    print("Aguardando 20 segundos...")
    time.sleep(20)
    
    result = ssm.get_command_invocation(
        CommandId=command_id,
        InstanceId=instance_id
    )
    
    print(f"Status: {result['Status']}")
    print(f"Output:\n{result.get('StandardOutputContent', 'Sem output')}")
    
    if result['Status'] == 'Success':
        print("\n✓✓✓ SUCESSO! Container reiniciado via SSM")
        exit(0)
    
except Exception as e:
    print(f"✗ Método 1 falhou: {e}")

print("\nTentando Método 2: Modificar User Data e Reboot...")
try:
    import base64
    user_data_b64 = base64.b64encode(restart_command.encode()).decode()
    
    ec2.modify_instance_attribute(
        InstanceId=instance_id,
        UserData={'Value': user_data_b64}
    )
    print("✓ User Data atualizado")
    
    ec2.reboot_instances(InstanceIds=[instance_id])
    print("✓ Reboot iniciado")
    print("⏳ Aguarde 3-5 minutos para o EC2 reiniciar e executar o script")
    
except Exception as e:
    print(f"✗ Método 2 falhou: {e}")

print("\n=== INSTRUÇÕES MANUAIS ===")
print("Se os métodos automáticos falharam, acesse:")
print(f"https://sa-east-1.console.aws.amazon.com/ec2/v2/home?region=sa-east-1#Instances:instanceId={instance_id}")
print("\n1. Clique em 'Connect' > 'Session Manager' > 'Connect'")
print("2. Cole estes comandos:")
print(restart_command)
