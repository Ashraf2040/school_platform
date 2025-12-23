export type ClientNotification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
  inquestId: string | null;
};
