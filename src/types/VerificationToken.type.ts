export interface VerificationTokenIntFace {

    id: number;

    token: string;

    expiresAt: Date;

    verifiedAt: Date | null;

    // createdAt: Date;
}

