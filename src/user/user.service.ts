import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.entity';
import { CreateUserInput, UpdateUserInput } from './user-inputs.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
  ) {}

  async findCurrentUser(id: Types.ObjectId) {
    try {
      return await this.UserModel.findById(id);
    } catch (err) {
      console.error(err);
    }
  }

  async createUser(createUserInput: CreateUserInput) {
    try {
      const normalizedEmail = this.normalizeEmail(createUserInput.email);
      const isUser = await this.UserModel.findOne({
        email: normalizedEmail,
      });
      if (isUser) {
        return new GraphQLError('Nah bro you already exist');
      } else {
        createUserInput.email = normalizedEmail;
        createUserInput.password = await bcrypt
          .hash(createUserInput.password, 10)
          .then((r) => r);
        return await new this.UserModel(createUserInput).save();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async login({ password, email }) {
    try {
      const normalizedEmail = this.normalizeEmail(email);
      this.logger.log(`Login attempt for ${normalizedEmail}`);
      const user = await this.UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        this.logger.warn(`Login failed for ${normalizedEmail}: user not found`);
        return new GraphQLError('Nah homie, wrong password/email');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      this.logger.log(
        `Login password check for ${normalizedEmail}: ${
          isPasswordValid ? 'ok' : 'failed'
        }`,
      );

      return isPasswordValid
        ? {
            token: await this.jwtService.signAsync({
              email: normalizedEmail,
              _id: user._id,
            }),
            user,
          }
        : new GraphQLError('Nah homie, wrong password/email');
    } catch (err) {
      console.error(err);
    }
  }

  async findAll() {
    try {
      return await this.UserModel.find().exec();
    } catch (err) {
      console.error(err);
    }
  }

  async updateUser(_id, updateUserInput: UpdateUserInput) {
    try {
      return await this.UserModel.findByIdAndUpdate(_id, updateUserInput, {
        new: true,
      }).exec();
    } catch (err) {
      console.error(err);
    }
  }

  async updatePassword(_id, currPass, newPass) {
    try {
      const User = await this.UserModel.findById(_id);
      if (await bcrypt.compare(currPass, User.password)) {
        User.password = await bcrypt.hash(newPass, 10);
        return await new this.UserModel(User).save();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async findOne(_id: Types.ObjectId) {
    try {
      return await this.UserModel.findById(_id);
    } catch (err) {
      console.error(err);
    }
  }

  async remove(_id: string) {
    try {
      return await this.UserModel.findByIdAndRemove(_id);
    } catch (err) {
      console.error(err);
    }
  }

  private normalizeEmail(email: string) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }
}
