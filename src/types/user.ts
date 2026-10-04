export type ChatUser = {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  photoUrl: string;
  createdAt: number;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthDate: string;
  photoFileUri: string | null;
};
