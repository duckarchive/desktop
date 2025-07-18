import { getSourcesBot } from "~/main/bot";

const softDeletePage = async (page: string) => {
  const bot = await getSourcesBot();
  await bot.edit(page, (rev) => {
    return {
      text: `{{швидко|видалення сторінки перенаправлення}}`,
      summary: "Видалення сторінки",
      minor: true,
    };
  });
};

const main = async () => {
  await softDeletePage(`Архів:ДАДнО/Р-6508/4/501`);
};
main();

// delete through API call not works because of lack of rights
// const deletePage = async () => {
//   const bot = await getSourcesBot();
//   await bot.delete("Архів:ДАДнО/Р-6508/10д2/11", "видалення сторінки перенаправлення");
// };

// deletePage();
