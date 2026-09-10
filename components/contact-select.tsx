"use client";

import { useId, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { CaretDown, CaretUp, Check } from "@phosphor-icons/react";
import "./contact-select.css";

export function ContactSelect({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  options,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  required?: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const errorId = useId();
  const [invalid, setInvalid] = useState(false);

  return (
    <div
      className="contact-select"
      onInvalidCapture={(event) => {
        // Radix retains a native select for FormData and required validation.
        // Direct its validation feedback to the visible, keyboard-ready trigger.
        event.preventDefault();
        setInvalid(true);
        trigger.current?.focus();
      }}
    >
      <Select.Root
        name={name}
        defaultValue={defaultValue}
        required={required}
        onValueChange={() => setInvalid(false)}
      >
        <Select.Trigger
          ref={trigger}
          id={id}
          className="contact-select-trigger"
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
        >
          <span className="contact-select-value">
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon className="contact-select-icon">
            <CaretDown size={18} aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="contact-select-content"
            position="popper"
            align="start"
            sideOffset={6}
            collisionPadding={16}
          >
            <Select.ScrollUpButton className="contact-select-scroll">
              <CaretUp size={17} aria-hidden="true" />
            </Select.ScrollUpButton>
            <Select.Viewport className="contact-select-viewport">
              {options.map((option) => (
                <Select.Item
                  className="contact-select-option"
                  key={option.value}
                  value={option.value}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="contact-select-check">
                    <Check size={17} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="contact-select-scroll">
              <CaretDown size={17} aria-hidden="true" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {invalid && (
        <span className="contact-select-error" id={errorId} role="alert">
          {placeholder || `Select ${label.toLowerCase()}.`}
        </span>
      )}
    </div>
  );
}
