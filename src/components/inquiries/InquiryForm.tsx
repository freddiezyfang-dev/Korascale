'use client';

import { useCallback, useEffect, useId, useState } from 'react';

import { Button, Heading, Text } from '@/components/common';
import { INQUIRY_HONEYPOT_FIELD } from '@/lib/inquiries/honeypot';

import { CORPORATE_REQUIRED_SERVICES, EMPTY_INQUIRY_FORM_VALUES } from './inquiryFormConfig';
import {
  buildInquiryPayload,
  mapApiErrorsToFormFields,
  serializePayloadForDuplicateCheck,
  shouldBlockDuplicateSubmit,
  validateInquiryFormValues,
} from './inquiryFormLogic';
import { submitInquiryClient } from './submitInquiryClient';
import type {
  InquiryClientFieldErrors,
  InquiryFormConfig,
  InquiryFormFieldKey,
  InquiryFormValues,
  InquirySubmissionContext,
} from './types';

type InquiryFormProps = {
  config: InquiryFormConfig;
  context: InquirySubmissionContext;
  /** Increment or change when the form should fully reset (e.g. modal reopened). */
  resetKey?: string | number;
  onSuccess?: (submissionId: string) => void;
  className?: string;
  /** Show a Close button on success (modal usage). */
  showCloseOnSuccess?: boolean;
  onClose?: () => void;
};

const inputClassName =
  'w-full rounded-md border border-gray-200 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1e3b32] focus:outline-none focus:ring-1 focus:ring-[#1e3b32]';

const inputErrorClassName =
  'border-red-300 focus:border-red-500 focus:ring-red-500';

function fieldLabel(config: InquiryFormConfig, field: InquiryFormFieldKey): string {
  const defaults: Record<InquiryFormFieldKey, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    travelDates: 'Travel dates',
    groupSize: 'Group size',
    destinations: 'Destinations',
    travelStyle: 'Travel style',
    company: 'Company',
    visitDates: 'Visit dates',
    visitorCount: 'Visitor count',
    cities: 'Cities',
    visitPurpose: 'Visit purpose',
    requiredServices: 'Required services',
    subject: 'Subject',
  };
  return config.fieldLabels[field] ?? defaults[field];
}

function isRequired(config: InquiryFormConfig, field: InquiryFormFieldKey): boolean {
  return config.requiredFields.includes(field);
}

export function InquiryForm({
  config,
  context,
  resetKey = 0,
  onSuccess,
  className,
  showCloseOnSuccess = false,
  onClose,
}: InquiryFormProps) {
  const formId = useId();
  const [values, setValues] = useState<InquiryFormValues>(EMPTY_INQUIRY_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<InquiryClientFieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [lastSuccessfulPayload, setLastSuccessfulPayload] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    setValues(EMPTY_INQUIRY_FORM_VALUES);
    setFieldErrors({});
    setGlobalError(null);
    setIsSubmitting(false);
    setSubmissionId(null);
    setLastSuccessfulPayload(null);
    setHoneypot('');
  }, [resetKey, config.variant]);

  const updateField = useCallback((field: InquiryFormFieldKey, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next._form;
      return next;
    });
    setGlobalError(null);
  }, []);

  const toggleService = useCallback((service: string) => {
    setValues((prev) => {
      const selected = prev.requiredServices.includes(service)
        ? prev.requiredServices.filter((item) => item !== service)
        : [...prev.requiredServices, service];
      return { ...prev, requiredServices: selected };
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError(null);

    const clientErrors = validateInquiryFormValues(values, config.requiredFields);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    const payload = buildInquiryPayload({ config, context, values });

    if (shouldBlockDuplicateSubmit(payload, lastSuccessfulPayload, isSubmitting)) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const result = await submitInquiryClient(payload, honeypot);

    setIsSubmitting(false);

    if (result.status === 'success') {
      setSubmissionId(result.submissionId);
      setLastSuccessfulPayload(serializePayloadForDuplicateCheck(payload));
      onSuccess?.(result.submissionId);
      return;
    }

    if (result.status === 'validation') {
      setFieldErrors(mapApiErrorsToFormFields(result.errors));
      return;
    }

    setGlobalError(result.message);
  };

  const renderFieldError = (field: InquiryFormFieldKey) => {
    const message = fieldErrors[field];
    if (!message) return null;
    const errorId = `${formId}-${field}-error`;
    return (
      <p className="text-xs text-red-500 mt-1" id={errorId} role="alert">
        {message}
      </p>
    );
  };

  const fieldInputProps = (field: InquiryFormFieldKey) => {
    const errorId = fieldErrors[field] ? `${formId}-${field}-error` : undefined;
    return {
      id: `${formId}-${field}`,
      'aria-invalid': fieldErrors[field] ? true : undefined,
      'aria-describedby': errorId,
      className: `${inputClassName}${fieldErrors[field] ? ` ${inputErrorClassName}` : ''}`,
    };
  };

  if (submissionId) {
    return (
      <div className={`text-center space-y-6 py-4 ${className ?? ''}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Heading level={3} className="text-2xl font-semibold">
          {config.successTitle}
        </Heading>
        <Text size="base" className="text-gray-600">
          {config.successMessage}
        </Text>
        <Text size="sm" className="text-gray-500">
          Reference: <span className="font-mono">{submissionId}</span>
        </Text>
        {showCloseOnSuccess && onClose ? (
          <Button type="button" onClick={onClose} className="px-8 py-2">
            Close
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`relative space-y-5 ${className ?? ''}`} noValidate>
      <div>
        {!showCloseOnSuccess ? (
          <Heading level={2} className="text-2xl font-semibold mb-2">
            {config.title}
          </Heading>
        ) : null}
        <Text size="sm" className="text-gray-600">
          {config.description}
        </Text>
      </div>

      {config.visibleFields.includes('name') ? (
        <div>
          <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-gray-700 mb-2">
            {fieldLabel(config, 'name')}
            {isRequired(config, 'name') ? ' *' : ''}
          </label>
          <input
            type="text"
            autoComplete="name"
            required={isRequired(config, 'name')}
            value={values.name}
            onChange={(e) => updateField('name', e.target.value)}
            {...fieldInputProps('name')}
          />
          {renderFieldError('name')}
        </div>
      ) : null}

      {config.visibleFields.includes('email') ? (
        <div>
          <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-gray-700 mb-2">
            {fieldLabel(config, 'email')}
            {isRequired(config, 'email') ? ' *' : ''}
          </label>
          <input
            type="email"
            autoComplete="email"
            required={isRequired(config, 'email')}
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
            {...fieldInputProps('email')}
          />
          {renderFieldError('email')}
        </div>
      ) : null}

      {config.visibleFields.includes('subject') ? (
        <div>
          <label
            htmlFor={`${formId}-subject`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'subject')}
            {isRequired(config, 'subject') ? ' *' : ''}
          </label>
          <input
            type="text"
            required={isRequired(config, 'subject')}
            value={values.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            {...fieldInputProps('subject')}
          />
          {renderFieldError('subject')}
        </div>
      ) : null}

      {config.visibleFields.includes('company') ? (
        <div>
          <label
            htmlFor={`${formId}-company`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'company')}
            {isRequired(config, 'company') ? ' *' : ''}
          </label>
          <input
            type="text"
            autoComplete="organization"
            required={isRequired(config, 'company')}
            value={values.company}
            onChange={(e) => updateField('company', e.target.value)}
            {...fieldInputProps('company')}
          />
          {renderFieldError('company')}
        </div>
      ) : null}

      {config.visibleFields.includes('travelDates') ? (
        <div>
          <label
            htmlFor={`${formId}-travelDates`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'travelDates')}
          </label>
          <input
            type="text"
            value={values.travelDates}
            onChange={(e) => updateField('travelDates', e.target.value)}
            placeholder="e.g. September 2026, 10 days"
            {...fieldInputProps('travelDates')}
          />
          {renderFieldError('travelDates')}
        </div>
      ) : null}

      {config.visibleFields.includes('visitDates') ? (
        <div>
          <label
            htmlFor={`${formId}-visitDates`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'visitDates')}
          </label>
          <input
            type="text"
            value={values.visitDates}
            onChange={(e) => updateField('visitDates', e.target.value)}
            placeholder="e.g. March 3–8, 2026"
            {...fieldInputProps('visitDates')}
          />
          {renderFieldError('visitDates')}
        </div>
      ) : null}

      {config.visibleFields.includes('groupSize') || config.visibleFields.includes('visitorCount') ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.visibleFields.includes('groupSize') ? (
            <div>
              <label
                htmlFor={`${formId}-groupSize`}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {fieldLabel(config, 'groupSize')}
              </label>
              <input
                type="text"
                value={values.groupSize}
                onChange={(e) => updateField('groupSize', e.target.value)}
                placeholder="e.g. 2 adults"
                {...fieldInputProps('groupSize')}
              />
              {renderFieldError('groupSize')}
            </div>
          ) : null}
          {config.visibleFields.includes('visitorCount') ? (
            <div>
              <label
                htmlFor={`${formId}-visitorCount`}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {fieldLabel(config, 'visitorCount')}
              </label>
              <input
                type="text"
                value={values.visitorCount}
                onChange={(e) => updateField('visitorCount', e.target.value)}
                placeholder="e.g. 4 visitors"
                {...fieldInputProps('visitorCount')}
              />
              {renderFieldError('visitorCount')}
            </div>
          ) : null}
        </div>
      ) : null}

      {config.visibleFields.includes('destinations') ? (
        <div>
          <label
            htmlFor={`${formId}-destinations`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'destinations')}
          </label>
          <textarea
            rows={3}
            value={values.destinations}
            onChange={(e) => updateField('destinations', e.target.value)}
            placeholder="e.g. Beijing, Shanghai, Chengdu"
            {...fieldInputProps('destinations')}
          />
          {renderFieldError('destinations')}
        </div>
      ) : null}

      {config.visibleFields.includes('cities') ? (
        <div>
          <label htmlFor={`${formId}-cities`} className="block text-sm font-medium text-gray-700 mb-2">
            {fieldLabel(config, 'cities')}
          </label>
          <input
            type="text"
            value={values.cities}
            onChange={(e) => updateField('cities', e.target.value)}
            placeholder="e.g. Shanghai, Shenzhen"
            {...fieldInputProps('cities')}
          />
          {renderFieldError('cities')}
        </div>
      ) : null}

      {config.visibleFields.includes('travelStyle') ? (
        <div>
          <label
            htmlFor={`${formId}-travelStyle`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'travelStyle')}
          </label>
          <input
            type="text"
            value={values.travelStyle}
            onChange={(e) => updateField('travelStyle', e.target.value)}
            placeholder="e.g. relaxed pace, boutique hotels"
            {...fieldInputProps('travelStyle')}
          />
          {renderFieldError('travelStyle')}
        </div>
      ) : null}

      {config.visibleFields.includes('visitPurpose') ? (
        <div>
          <label
            htmlFor={`${formId}-visitPurpose`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'visitPurpose')}
          </label>
          <input
            type="text"
            value={values.visitPurpose}
            onChange={(e) => updateField('visitPurpose', e.target.value)}
            placeholder="e.g. supplier meetings, factory tour"
            {...fieldInputProps('visitPurpose')}
          />
          {renderFieldError('visitPurpose')}
        </div>
      ) : null}

      {config.visibleFields.includes('requiredServices') ? (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            {fieldLabel(config, 'requiredServices')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CORPORATE_REQUIRED_SERVICES.map((service) => (
              <label
                key={service.value}
                className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-[#1e3b32] focus:ring-[#1e3b32]"
                  checked={values.requiredServices.includes(service.value)}
                  onChange={() => toggleService(service.value)}
                />
                <span>{service.label}</span>
              </label>
            ))}
          </div>
          {renderFieldError('requiredServices')}
        </fieldset>
      ) : null}

      {config.visibleFields.includes('message') ? (
        <div>
          <label
            htmlFor={`${formId}-message`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {fieldLabel(config, 'message')}
            {!isRequired(config, 'message') ? (
              <span className="text-gray-400 font-normal"> (Optional)</span>
            ) : (
              ' *'
            )}
          </label>
          <textarea
            rows={4}
            required={isRequired(config, 'message')}
            value={values.message}
            onChange={(e) => updateField('message', e.target.value)}
            {...fieldInputProps('message')}
          />
          {renderFieldError('message')}
        </div>
      ) : null}

      <div
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor={`${formId}-hp`}>Company website</label>
        <input
          tabIndex={-1}
          autoComplete="off"
          id={`${formId}-hp`}
          name={INQUIRY_HONEYPOT_FIELD}
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {fieldErrors._form || globalError ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3" role="alert">
          <Text size="sm" className="text-red-600">
            {fieldErrors._form ?? globalError}
          </Text>
        </div>
      ) : null}

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="px-8 py-2 w-full sm:w-auto">
          {isSubmitting ? 'Submitting…' : config.submitLabel}
          {isSubmitting ? <span className="sr-only">Submitting inquiry</span> : null}
        </Button>
      </div>
    </form>
  );
}
