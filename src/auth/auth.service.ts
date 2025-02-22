import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthDto } from './dto/auth.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async signUp(authDto: AuthDto): Promise<{ access_token: string }> {
    const { email, password, username } = authDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({ email, username, password: hashedPassword });
    await this.userRepo.save(user);

    return this.generateToken(user);
  }

  async signIn(authDto: AuthDto): Promise<{ access_token: string }> {
    const { email, password } = authDto;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User): { access_token: string } {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }
}
