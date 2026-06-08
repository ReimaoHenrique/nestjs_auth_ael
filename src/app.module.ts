import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FinancialModule } from './financial/financial.module';

@Module({
  imports: [AuthModule, FinancialModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
