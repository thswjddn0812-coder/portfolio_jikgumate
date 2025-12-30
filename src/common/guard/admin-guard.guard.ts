import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuardGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);
    // 토큰 페이로드의 키가 'is_admin'이므로 똑같이 맞춰줍니다.
    // 숫자 1 또는 boolean true 모두 통과되도록 작성
    const isAdmin = user && (user.isAdmin === 1 || user.isAdmin === true);

    if (!isAdmin) {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}
