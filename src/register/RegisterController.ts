import { Router, Request, Response} from "express";
import RegisterService from "./RegisterService";
import { User as UserEntity } from "../entity/User";
import { User as UserAble } from "../types/User.type";
import { randomBytes, scrypt } from "crypto";
import validation from "../middleware/validation";
import { randomString, sendEmail } from "../util/verify-email";  
import VerifyEmailController from "../verify-email/VerifyEmail.controller";
import { checks, errors } from "./RegisterValidator";


export default class RegisterController {
  public router: Router;
  private readonly registerService: RegisterService;
  
  constructor(){
    this.router = Router();
    this.registerService = new RegisterService();
    this.routes();
  }
  

  private async handleBody({ body }: Request): Promise<UserAble>  {
    const user = { ...body };
    user.password = await this.hashPassword(user.password);
    
    return user as UserAble;
  }
  
  
  
  private hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(16).toString("hex");
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ":" + derivedKey.toString("hex"));
      });
    });
  }

  
  private registerUser = async (req: Request, res: Response): Promise<Response> => {
    const user: UserAble = await this.handleBody(req);
    //console.log(req.body, req["body"], user);
    if(await this.registerService.checkEmail(user.email)){
      return res.status(403).send("Email already in use. Please login, or try another.");
    }

    const newUserTkn = await this.registerService.create(user);
    VerifyEmailController.sendEmail(user.email, user.name!.split(" ")[0], newUserTkn);
    return res.status(201).json(newUserTkn);
  }
  
  private routes(): void{
    this.router.post("/", checks, errors, this.registerUser)
  }
}

