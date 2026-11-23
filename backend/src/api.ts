import { BadRequestException, Body, Controller, createParamDecorator, Delete, ExecutionContext, Get, Header, HttpCode, Param, ParseIntPipe, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilePictures, profilePictureLimit } from './profile-pictures';
import type { PictureUpload } from './profile-pictures';
import { Auth, Public, Roles } from './auth';
import { BookingDecision, BookingInput, EquipmentInput, InventoryInput, Login, RegistrationInput, ScheduleInput, UserInput, UserUpdate } from './dto';
import { RegistrationLimit } from './registration-limit';
import { Role, User } from './entities';
import { Gym } from './gym';

const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): User =>
  context.switchToHttp().getRequest().user,
);

class PositiveIdPipe extends ParseIntPipe {
  async transform(value: string, metadata: Parameters<ParseIntPipe['transform']>[1]) {
    const id = await super.transform(value, metadata);
    if (id < 1 || id > 2147483647) throw new BadRequestException('Invalid record ID');
    return id;
  }
}
const Id = () => Param('id', PositiveIdPipe);

@Controller()
export class Api {
  constructor(private auth: Auth, private gym: Gym, private pictures: ProfilePictures) {}

  @Get('bookings')
  @Roles(Role.ADMIN, Role.MEMBER)
  bookings(@CurrentUser() user: User) {
    return this.gym.bookings(user);
  }

  @Post('bookings')
  @Roles(Role.MEMBER)
  createBooking(@Body() input: BookingInput, @CurrentUser() user: User) {
    return this.gym.createBooking(input, user);
  }

  @Patch('bookings/:id/decision')
  @Roles(Role.ADMIN)
  decideBooking(@Id() id: number, @Body() input: BookingDecision) {
    return this.gym.decideBooking(id, input);
  }

  @Patch('bookings/:id/cancel')
  @Roles(Role.MEMBER)
  cancelBooking(@Id() id: number, @CurrentUser() user: User) {
    return this.gym.cancelBooking(id, user);
  }

  @Post('auth/register')
  @Public()
  @UseGuards(RegistrationLimit)
  register(@Body() input: RegistrationInput) {
    return this.auth.register(input);
  }

  @Post('auth/login')
  @Public()
  @HttpCode(200)
  login(@Body() input: Login) {
    return this.auth.login(input);
  }

  @Get('auth/me')
  me(@CurrentUser() user: User) {
    return user;
  }

  @Get('auth/me/profile-picture')
  @Roles(Role.MEMBER)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  profilePicture(@CurrentUser() user: User) {
    return this.pictures.read(user.userId);
  }

  @Post('auth/me/profile-picture')
  @Roles(Role.MEMBER)
  @HttpCode(204)
  @UseInterceptors(FileInterceptor('picture', { limits: { fileSize: profilePictureLimit + 1, files: 1, fields: 0, parts: 2 } }))
  uploadProfilePicture(@CurrentUser() user: User, @UploadedFile() file?: PictureUpload) {
    return this.pictures.save(user.userId, file);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: User) {
    return this.gym.dashboard(user);
  }

  @Get('users')
  @Roles(Role.ADMIN)
  users() {
    return this.gym.users();
  }

  @Post('users')
  @Roles(Role.ADMIN)
  addUser(@Body() input: UserInput) {
    return this.gym.saveUser(input);
  }

  @Put('users/:id')
  @Roles(Role.ADMIN)
  editUser(@Id() id: number, @Body() input: UserUpdate, @CurrentUser() user: User) {
    return this.gym.saveUser(input, id, user);
  }

  @Get('schedules')
  schedules(@CurrentUser() user: User) {
    return this.gym.schedules(user);
  }

  @Post('schedules')
  @Roles(Role.ADMIN, Role.STAFF)
  addSchedule(@Body() input: ScheduleInput, @CurrentUser() user: User) {
    return this.gym.saveSchedule(input, user);
  }

  @Put('schedules/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  editSchedule(@Id() id: number, @Body() input: ScheduleInput, @CurrentUser() user: User) {
    return this.gym.saveSchedule(input, user, id);
  }

  @Delete('schedules/:id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  removeSchedule(@Id() id: number) {
    return this.gym.removeSchedule(id);
  }

  @Get('equipment')
  equipment() {
    return this.gym.equipment();
  }

  @Post('equipment')
  @Roles(Role.ADMIN)
  addEquipment(@Body() input: EquipmentInput, @CurrentUser() user: User) {
    return this.gym.saveEquipment(input, user);
  }

  @Put('equipment/:id')
  @Roles(Role.ADMIN)
  editEquipment(@Id() id: number, @Body() input: EquipmentInput, @CurrentUser() user: User) {
    return this.gym.saveEquipment(input, user, id);
  }

  @Delete('equipment/:id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  removeEquipment(@Id() id: number) {
    return this.gym.removeEquipment(id);
  }

  @Get('inventory')
  @Roles(Role.ADMIN, Role.STAFF)
  inventory() {
    return this.gym.inventory();
  }

  @Patch('inventory/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  updateInventory(@Id() id: number, @Body() input: InventoryInput, @CurrentUser() user: User) {
    return this.gym.updateInventory(id, input.quantity, user);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: User) {
    return this.gym.notifications(user);
  }

  @Patch('notifications/:id/read')
  markRead(@Id() id: number, @CurrentUser() user: User) {
    return this.gym.markRead(id, user);
  }
}
