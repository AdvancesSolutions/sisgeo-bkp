import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import { EmployeeAccessController } from './employee-access.controller';
import { EmployeeAccessService } from './employee-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee, Location]),
  ],
  controllers: [EmployeeAccessController],
  providers: [EmployeeAccessService],
})
export class EmployeeAccessModule {}
