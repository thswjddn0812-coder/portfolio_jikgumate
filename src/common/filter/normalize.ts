import { HttpException } from '@nestjs/common';

export const normalizeHttpException = (e: HttpException) => {
  const r = e.getResponse() as any;
  const msg = r?.message;

  if (typeof r === 'string') return { message: r };
  if (Array.isArray(msg))
    return { message: '입력값이 유효하지 않습니다', errors: msg };
  if (typeof msg === 'string') return { message: msg };

  return { message: r?.error || e.message || '요청 처리 실패' };
};
