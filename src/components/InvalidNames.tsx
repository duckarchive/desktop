interface InvalidNamesProps {
  invalidFileNames: string[];
  onClose?: () => void;
}

const InvalidNames: React.FC<InvalidNamesProps> = ({ invalidFileNames, onClose }) => (
  <div className="bg-yellow-100 px-4 py-2 rounded-xl text-gray-800 relative">
    <p className="font-semibold">Пропущені файли:</p>
    <ul className="list-disc list-outside italic text-red-800">
      {invalidFileNames.map((path) => (
        <li key={path}>{path}</li>
      ))}
    </ul>
    <details className="mt-4 rounded-lg text-sm">
      <summary className="cursor-pointer">Очікуваний формат</summary>
      <div className="text-left mt-2">
        <code className="bg-gray-200 px-2 py-1 rounded text-sm block mb-2">
          Архів Фонд-Опис-Справа. Роки. Назва.pdf
        </code>
        <p className="font-semibold">Структура:</p>
        <ul className="list-disc list-outside mb-2">
          <li>
            <p className="inline font-semibold">Архів</p> — код архіву
          </li>
          <li>
            <p className="inline font-semibold">Фонд-Опис-Справа</p> — через
            дефіс
          </li>
          <li>
            <p className="inline font-semibold">Роки</p> — діапазон років
          </li>
          <li>
            <p className="inline font-semibold">Назва</p> — описова назва
            документу
          </li>
        </ul>
        <p className="font-semibold">Приклади правильних назв:</p>
        <ul className="list-disc list-outside italic">
          <li>ДАЛО 123-4-56. 1925-1930. Листування.pdf</li>
          <li>ЦДАВО Р1-2-3. 1920. Протокол засідання.pdf</li>
          <li>ЦДІАК П789-10-11. 1918. Акт передачі.pdf</li>
        </ul>
      </div>
    </details>
    <button
      className="absolute top-1 right-1 z-50 bg-transparent cursor-pointer border-none text-gray-600"
      onClick={() => {
        if (typeof onClose === "function") {
          onClose();
        }
      }}
    >
      x
    </button>
  </div>
);

export default InvalidNames;
