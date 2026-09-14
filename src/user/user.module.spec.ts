import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user.module';

describe('UserModule', () => {
  it('imports ConfigModule for JwtStrategy dependency injection', () => {
    const imports = Reflect.getMetadata('imports', UserModule) || [];

    expect(imports).toContain(ConfigModule);
  });
});
