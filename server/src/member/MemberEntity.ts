export type MemberEntity = {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
  name: string | null;
  location: string | null;
  education: string | null;
  profession: string | null;
  member_type: string | null;
  gender: string | null;
  year_of_birth: number | null;
  expiration_date: Date | null;
  chapter_id: number | null;
  employer: string | null;
};
