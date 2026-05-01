import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const AUTH_RESPONSE = {
  schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIs...',
      user: { id: '664a...', name: 'QA User', email: 'qa@example.com', role: 'user' },
    },
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiResponse({ status: 201, ...AUTH_RESPONSE })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @ApiResponse({ status: 201, ...AUTH_RESPONSE })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
