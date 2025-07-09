import {
  Controller,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
  Patch,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request): Promise<ProfileDto> {
    let userId = req.user?.primarykey;
    if (!userId) {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        try {
          const payload = this.jwtService.verify(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET,
        });
          userId = payload.sub;
        } catch (err) {
          throw new UnauthorizedException('Invalid refresh token', err);
        }
      }
    }

    if (!userId) {
      throw new UnauthorizedException('User ID not found when getting profile');
    }

    return this.profileService.getProfile(userId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: Request,
    @Body() updateData: UpdateProfileDto,
  ): Promise<ProfileDto> {
    console.log('Received update data:', updateData);
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.profileService.updateProfile(userId, updateData);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: Request,
    @Body() passwordData: ChangePasswordDto,
  ): Promise<void> {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    return this.profileService.changePassword(userId, passwordData);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    return this.profileService.uploadAvatar(userId, file);
  }
}
