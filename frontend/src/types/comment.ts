export interface Comment {
    id: number;
    user: {
        id: number;
        email: string;
        username?: string;
    };
    content: string;
    created_at: string;
    replies: Comment[];
}

