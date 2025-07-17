import { Button, ButtonProps } from "@heroui/button";
import React from "react";

interface CloseButtonProps extends ButtonProps {};

const CloseButton: React.FC<CloseButtonProps> = ({
  className = "",
  ...buttonProps
}) => (
  <Button
    isIconOnly
    radius="full"
    size="sm"
    color="danger"
    className={`text-xl font-bold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    aria-label="видалити файл"
    {...buttonProps}
  >
    <span className="mt-0.5">✕</span>
  </Button>
);

export default CloseButton;