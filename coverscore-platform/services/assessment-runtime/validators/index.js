// Validators — pluggable answer validators for the runtime

class EmailValidator {
  validate(value) {
    if (!value) return { valid: false, error: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(value);
    return {
      valid,
      error: valid ? null : 'Please enter a valid email address (e.g., name@domain.com)',
      normalized: valid ? value.toLowerCase().trim() : value
    };
  }
}

class PhoneValidator {
  validate(value) {
    if (!value) return { valid: false, error: 'Phone number is required' };
    // Accept international format: +2348012345678 or 08012345678
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?\d{10,15})$/;
    const valid = phoneRegex.test(cleaned);
    return {
      valid,
      error: valid ? null : 'Please enter a valid phone number (e.g., +2348012345678)',
      normalized: valid ? cleaned : value
    };
  }
}

class NumberValidator {
  validate(value) {
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: 'A number is required' };
    }
    const num = Number(value);
    const valid = !isNaN(num) && isFinite(num);
    return {
      valid,
      error: valid ? null : 'Please enter a valid number',
      normalized: valid ? num : value
    };
  }

  validateWithRange(value, min, max) {
    const result = this.validate(value);
    if (!result.valid) return result;
    const num = result.normalized;
    if (min !== undefined && num < min) {
      return { valid: false, error: `Value must be at least ${min}`, normalized: value };
    }
    if (max !== undefined && num > max) {
      return { valid: false, error: `Value must be at most ${max}`, normalized: value };
    }
    return result;
  }
}

class ChoiceValidator {
  validate(value, validOptions) {
    if (!value) return { valid: false, error: 'Please select an option' };
    const match = validOptions.find(o => o.value === value);
    if (!match) {
      return {
        valid: false,
        error: `Invalid selection. Valid options: ${validOptions.map(o => o.value).join(', ')}`,
        normalized: value
      };
    }
    return { valid: true, option: match, normalized: value };
  }
}

class TextValidator {
  validate(value, minLength = 1, maxLength = 1000) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Text input is required' };
    }
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      return { valid: false, error: `Response must be at least ${minLength} character(s)` };
    }
    if (trimmed.length > maxLength) {
      return { valid: false, error: `Response must be at most ${maxLength} characters` };
    }
    return { valid: true, normalized: trimmed };
  }
}

// Validator registry
const validators = {
  email: new EmailValidator(),
  phone: new PhoneValidator(),
  number: new NumberValidator(),
  choice: new ChoiceValidator(),
  text: new TextValidator(),
  yes_no: new ChoiceValidator()
};

function getValidator(type) {
  const v = validators[type];
  if (!v) return validators.text;
  return v;
}

module.exports = {
  EmailValidator,
  PhoneValidator,
  NumberValidator,
  ChoiceValidator,
  TextValidator,
  getValidator,
  validators
};
