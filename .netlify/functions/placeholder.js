// 占位文件，确保.netlify/functions目录存在
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "服务器正常运行" })
  };
}; 