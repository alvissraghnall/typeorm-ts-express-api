import { User as UserEntity } from "../entity/User";
import VerifyEmailService from "./VerifyEmail.service";
import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import { createTransport } from "nodemailer";
import { getRepository, Repository } from "typeorm";
  

export default class VerifyEmailController {
  public router: Router;
  private verifyEmailService: VerifyEmailService;
  private wrongUniqueString: string = "The string you entered is incorrect. Verify, and try again.";
  private noUniqueString: string = "No unique string provided. Provide one, and try again.";
  private userRepository: Repository<UserEntity>

  constructor() {
    this.router = Router();
    this.verifyEmailService = new VerifyEmailService();
    this.userRepository = getRepository(UserEntity);
    this.routeHandler();
  }

  
  private verify = async (req: Request, res: Response) => {
    const { queryString } = req.params;
    if(!queryString) return res.status(400).send(this.noUniqueString);
    const exists = await this.verifyEmailService.checkExistence(queryString);
    // first, check if user with query string provided exists.
    if(!exists) return res.status(401).send(this.wrongUniqueString);
    //  // if user does not exist, throw error.

    if(exists.verifiedAt) {
      return res.status(204).json({
        msg: "User already confirmed."
      })
    }

    const tokenExpiry = exists.expiresAt;
    if(new Date() > tokenExpiry) {
      this.verifyEmailService.delete(exists);
      const user = await this.userRepository.findOne({
        where: {id: exists.user}
      })
      this.userRepository.remove(user!)
      return res.status(401)
        .json({ msg: "user failed to authenticate mail withun 24 hours. Please re sign-up to use our service."})
    }
    // check if token is expired
    const updateIsVerified = await this.verifyEmailService.updateVerifiedAt(queryString);
    console.log(updateIsVerified);
    
    // // else, update table to reflect change in isVerified column to true. 
    // const deleteQueryString = await this.verifyEmailService.delete(queryString);
    // console.log(deleteQueryString);
    
    return res.sendStatus(200);
    // // // (???) delete queryString . unsure at the moment about this part.
  }
  
  public static randomString (): string {
    return randomBytes(8).toString("hex");
  }
  
  public static sendEmail = (email: string, name: string, uniqueStr?: string) => {
    const ProdTransport = createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAILPWD
      }
    });
  
    const DevTransport = createTransport(
      {
        host: "localhost",
        port: 1025,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      }
    )
    
    let sender = process.env.EMAILSENDER;
    let mailOptions = {
      from: sender,
      to: email,
      subject: "Email Verification for " + name,
      html: `Please click <a href=${process.env.URL}/verify/${uniqueStr}> here </a> to verify your Email address. Thanks!`
    }
    
    process.env.NODE_ENV === "prod" ? ProdTransport.sendMail(mailOptions, (err, response) => {
      err ? console.error(err as Error) : console.log("Message sent!")
    }) : DevTransport.sendMail(mailOptions, (err, response) => {
      err ? console.error(err as Error) : console.log("Message sent!")
    });
  }

  private routeHandler(): void {
    this.router.post("/:queryString", this.verify);
  }
}