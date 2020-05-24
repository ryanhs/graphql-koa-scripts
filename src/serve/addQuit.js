module.exports = async (dependencies) => {
  const quit = () => dependencies.hook.emit('quit');
  return { ...dependencies, quit };
};
