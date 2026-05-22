export const formatRelativeDate = (dateString?: string, language: string = "ru") => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  
  if (diffInSeconds < 60) {
    return language === "ru" ? "только что" : "just now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return formatter.format(-diffInMinutes, "minute");
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return formatter.format(-diffInHours, "hour");
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return formatter.format(-diffInDays, "day");
  }
  
  return date.toLocaleDateString(language, { day: "numeric", month: "long" });
};
