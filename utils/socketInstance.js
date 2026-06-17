let io = null;

/**
 * Set the Socket.io instance
 * @param {Object} ioInstance - The Socket.io server instance
 */
function setIO(ioInstance) {
  io = ioInstance;
}

/**
 * Get the Socket.io instance
 * @returns {Object} The Socket.io server instance
 * @throws {Error} If io instance has not been initialized
 */
function getIO() {
  if (io === null) {
    throw new Error('Socket.io instance not initialized. Call setIO() first.');
  }
  return io;
}

export {
  setIO,
  getIO
};
