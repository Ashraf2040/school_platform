import { prisma } from "@/lib/prisma";

 

export const getAnnouncements = async () => {
  const announcements = await prisma.announcement.findMany();
  return announcements;
}
 
 