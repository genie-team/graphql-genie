Must have a Role ENUM

Context: Must pass in an authenticate function which returns true if the operation is allowed if the operation is not allowed either return false or throw an error. The function should also have any other constraint logic necessary, such as users not being able to create roles on themselves, or only set the author field on post to themselves