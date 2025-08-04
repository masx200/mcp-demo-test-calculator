from registry.cn-hangzhou.aliyuncs.com/masx200/mcp-demo-test-calculator:latest

run mkdir -pv /root/mcp-demo-test-calculator
WORKDIR /root/mcp-demo-test-calculator

COPY ./* /root/mcp-demo-test-calculator

run npm config set registry https://registry.npmmirror.com

run npm install -g cnpm --registry=https://registry.npmmirror.com

run cnpm install --force

cmd ["node", "index-streamable-http.js"]
expose 3000