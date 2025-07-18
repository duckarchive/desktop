import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import { ARCHIVES } from "~/main/parse";
import { Input } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

type FileNameInputProps = {
  onChange: (value: string) => void;
};

interface FileNameInput {
  a: string;
  f: string;
  d: string;
  c: string;
  years: string;
  name: string;
}

const CYRILLIC_NUM_REGEX = /^[\u0400-\u04FF0-9]*$/;
const CYRILLIC_NUM_COMMA_DOT_REGEX = /^[\u0400-\u04FF0-9,.\s]*$/;
const YEAR_RANGE_REGEX = /^(\d{4})(-(\d{4}))?$/;

function validateYearRange(value: string) {
  if (!YEAR_RANGE_REGEX.test(value)) return false;
  const [start, end] = value.split("-");
  if (end && start === end) return false;
  return true;
}

export const FileNameInput: React.FC<FileNameInputProps> = ({
  onChange,
}) => {
  const [local, setLocal] = useState<FileNameInput>({
    a: "",
    f: "",
    d: "",
    c: "",
    years: "",
    name: "",
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!local.a && !local.f && !local.d && !local.c && !local.years && !local.name) return;
      onChange(`${local.a} ${local.f}-${local.d}-${local.c}. ${local.years}. ${local.name}`);
    }, 300);
    return () => clearTimeout(handler);
  }, [local]);

  const handleInput = useCallback(
    (field: keyof typeof local, regex: RegExp | null = null) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (regex && val && !regex.test(val)) return;
        setLocal((prev) => ({ ...prev, [field]: val }));
      },
    []
  );

  const handleYears = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d-]/g, "");
    if (val.length > 9) return;
    setLocal((prev) => ({ ...prev, years: val }));
  };

  const yearsValid = local.years === "" || validateYearRange(local.years);

  return (
    <>
      <h4 className="text-sm font-semibold">Конструктор назви файлу:</h4>
      <div className="flex gap-0 bg-white rounded-xl px-2 pb-1 rounded-b-none">
        {/* архів */}
        <Autocomplete
          label="Архів"
          variant="underlined"
          className="basis-[20%] grow-0"
          isClearable={false}
          selectedKey={local.a}
          onSelectionChange={(key) => {
            setLocal((prev) => ({ ...prev, a: key ? String(key) : "" }));
          }}
        >
          {Object.entries(ARCHIVES).map(([code, title]) => (
            <AutocompleteItem key={code} textValue={code}>
              <p title={title}>{code}</p>
            </AutocompleteItem>
          ))}
      </Autocomplete>

        {/* фонд */}
        <Input
          variant="underlined"
          className="basis-[10%] grow-0"
          type="text"
          label="Фонд"
          placeholder="Р5432"
          value={local.f}
          onChange={handleInput("f", CYRILLIC_NUM_REGEX)}
          maxLength={20}
        />

        {/* опис */}
        <Input
          variant="underlined"
          className="basis-[10%] grow-0"
          type="text"
          label="Опис"
          placeholder="12ДОД"
          value={local.d}
          onChange={handleInput("d", CYRILLIC_NUM_REGEX)}
          maxLength={20}
        />

        {/* справа */}
        <Input
          variant="underlined"
          className="basis-[10%] grow-0"
          type="text"
          label="Справа"
          placeholder="123А"
          value={local.c}
          onChange={handleInput("c", CYRILLIC_NUM_REGEX)}
          maxLength={20}
        />

        {/* роки */}
        <Input
          variant="underlined"
          className="basis-1/6"
          type="text"
          label="Роки"
          placeholder="1890-1891"
          value={local.years}
          onChange={handleYears}
          maxLength={9}
          isInvalid={!yearsValid}
        />

        {/* назва */}
        <Input
          variant="underlined"
          className="basis-1/2"
          type="text"
          label="Назва"
          placeholder="Метрична книга села Привітне"
          value={local.name}
          onChange={handleInput("name", CYRILLIC_NUM_COMMA_DOT_REGEX)}
          maxLength={100}
        />
      </div>
    </>
  );
};

export default FileNameInput;
