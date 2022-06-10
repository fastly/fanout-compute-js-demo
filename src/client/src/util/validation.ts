export interface FieldError {
  fieldName: string;
  errorCode: string;
  errorDescription: string;
}

// make sure user ID and room ID are valid.
// 4-16 alphanumeric + underscore, must start with alphabet, must not end with underscore

const validRegex = /^[a-z][-_.a-z\d]{1,14}[a-z\d]$/;
const validChars = /^[-_.a-z\d]*$/;
const validStart = /^[a-z]/;
const validEnd = /[a-z\d]$/;

function validateIdentifier(id: string, label: string): FieldError[] {
  const errors: FieldError[] = [];

  if(validRegex.test(id)) {
    return errors;
  }

  if(id.length < 4 || id.length > 16) {
    errors.push({
      fieldName: 'userId',
      errorCode: 'FORMAT',
      errorDescription: `${label} must be 3-16 characters long.`,
    });
  }
  if(!validChars.test(id)) {
    errors.push({
      fieldName: 'userId',
      errorCode: 'FORMAT',
      errorDescription: `${label} can contain letters, numbers, hyphen, dots, and underscores.`,
    });
  }
  if(!validStart.test(id)) {
    errors.push({
      fieldName: 'userId',
      errorCode: 'FORMAT',
      errorDescription: `${label} must start with a letter.`,
    });
  }
  if(!validEnd.test(id)) {
    errors.push({
      fieldName: 'userId',
      errorCode: 'FORMAT',
      errorDescription: `${label} must end with a letter or number.`,
    });
  }

  return errors;
}

export function validateUserId(userId: string): FieldError[] {
  return validateIdentifier(userId, 'User ID');
}

export function validateRoomId(roomId: string): FieldError[] {
  return validateIdentifier(roomId, 'Room ID');
}
