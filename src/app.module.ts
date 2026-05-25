import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { UserModule } from './user/user.module'
import { SubscriptionModule } from './subscription/subscription.module';
import { OtpModule } from './otp/otp.module';
import { UserPreferenceModule } from './user-preference/user-preference.module';
import { LikeModule} from './likes/likes.module';
import { VisitModule } from './visits/visits.module';
import { PGDetailsModule } from './pg-details/pg-details.module';
import { ApartmentModule } from './apartment/apartment.module';
import { PropertyViewModule } from './property-view/property-view.module';
import { MessageModule } from './messages/messages.module';


@Module({
  imports: [PrismaModule, UserModule, SubscriptionModule, OtpModule, UserPreferenceModule, LikeModule, VisitModule, PGDetailsModule, ApartmentModule, PropertyViewModule, MessageModule],
})
export class AppModule {}