import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersRepository.existsBy({ email: dto.email });
    if (exists) {
      throw new ConflictException('Email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      groups: [],
    });
    const saved = await this.usersRepository.save(user);
    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      relations: ['groups'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      groups: user.groups?.map((group) => group.name) ?? [],
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
