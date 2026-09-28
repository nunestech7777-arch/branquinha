export const dateConfig = {
  herName: "Meu Bem",
  myName: "Seu Admirador",
  date: "Em breve",
  availableTimes: ["19:00", "20:00"] as const,
  location: "Um lugarzinho incrível e especial",
  message: "Mal posso esperar pelo nosso momento!",
  invitationId: "date-invitation-main",
};

export type AvailableTime = (typeof dateConfig.availableTimes)[number];
export default dateConfig;
