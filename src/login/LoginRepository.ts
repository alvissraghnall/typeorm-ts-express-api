import {
  Repository,
  EntityRepository
} from "typeorm";
import { User as UserEntity } from "../entity/User";
import RegisterRepository from "../register/RegisterRepository";
import { LoginRepo } from "../types/General";


@EntityRepository(UserEntity)
export default class LoginRepository extends RegisterRepository {
  public findByEmail(email: string): any {
    return this.findOne({
      select: ["password", "isVerified"],
      where: { email }
    })
  }
}