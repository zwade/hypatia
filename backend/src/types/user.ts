export interface User {
    uid: string;
    username: string;
    email: string;
    isVerified: boolean;
    isSingleUser?: boolean;
}