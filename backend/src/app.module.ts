import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PartnersModule } from './partners/partners.module';
import { AccountsModule } from './accounts/accounts.module';
import { SourcesModule } from './sources/sources.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ObligationsModule } from './obligations/obligations.module';
import { AllocationsModule } from './allocations/allocations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThirdPartiesModule } from './third-parties/third-parties.module';

@Module({
  imports: [
    PrismaModule,
    PartnersModule,
    ThirdPartiesModule,
    AccountsModule,
    SourcesModule,
    CategoriesModule,
    TransactionsModule,
    ObligationsModule,
    AllocationsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
