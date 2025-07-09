import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Req() req, @Body() createEventDto: CreateEventDto) {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    console.log(createEventDto)
    return this.calendarService.createEvent(userId, createEventDto);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    return this.calendarService.getEvents(userId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    return this.calendarService.getEventById(id, userId);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    console.log(updateEventDto)
    return this.calendarService.updateEvent(id, userId, updateEventDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.primarykey;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }
    return this.calendarService.deleteEvent(id, userId);
  }
}
