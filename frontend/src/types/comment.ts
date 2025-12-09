export interface CommentImage {
    id: number;
    image: string;
    is_video?: boolean;
}

export interface Comment {
    id: number;
    user: {
        id: number;
        email: string;
        username?: string;
        profile?: {
            id: number;
            email: string;
            full_name: string;
            phone_number: string;
            avatar_url: string | null;
        };
    };
    content: string;
    created_at: string;
    replies: Comment[];
    images?: CommentImage[];
}
