import { Mwn } from "mwn";
import { sourcesOptions } from ".";

const editPage = async () => {
  const bot = await Mwn.init(sourcesOptions);

  await bot.edit('Архів:ДАДнО/К/Ф', (rev) => {
    // rev.content gives the revision text
    // rev.timestamp gives the revision timestamp

    let text = rev.content.replace(/Тут опубліковані/g, 'На Вікіджерелах опубліковані');

    return {
        // return parameters needed for [[mw:API:Edit]]
        text: text,
        summary: '',
        minor: true
    };
});
};

editPage();
