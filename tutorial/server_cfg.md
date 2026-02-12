# 服务器配置文档

## 概述

本文档记录了Ubuntu 22.04服务器的安全配置，包括用户权限管理、SSH安全设置和网站部署用户配置。

## 一、用户管理

### 1.1 常用账户配置

#### 创建管理员账户

```bash
# 创建管理员账户（假设用户名为admin）
sudo useradd -m -s /bin/bash admin
sudo passwd admin

# 将admin加入sudo组
sudo usermod -a -G sudo admin
```

#### 验证sudo权限

```bash
# 切换到admin用户
su - admin

# 测试sudo权限
sudo whoami
# 应该输出：root
```

### 1.2 网站部署用户配置

#### 创建webdeploy用户

```bash
# 创建webdeploy用户
sudo useradd -m -s /usr/sbin/nologin webdeploy
sudo passwd webdeploy

# 将webdeploy加入nginx组
sudo usermod -a -G www-data webdeploy

# 验证用户创建
id webdeploy
```

#### 设置目录权限

**重要：ChrootDirectory安全要求**

SSH的ChrootDirectory有严格的安全要求：
- ChrootDirectory指定的目录及其所有上级目录的所有者必须是root
- 权限最大只能是755
- 不能有群组写权限

**正确的目录结构：**

```
/var/www/              # root:root, 755 (ChrootDirectory)
└── html/            # webdeploy:www-data, 770 (用户可写)
    ├── index.html
    ├── styles.css
    ├── app.js
    └── content/
```

**配置步骤：**

```bash
# 1. 设置/var/www目录（ChrootDirectory）
# 所有者必须是root，权限755
sudo chown root:root /var/www
sudo chmod 755 /var/www

# 2. 设置/var/www/html目录（用户可写）
WEB_ROOT="/var/www/html"
sudo chown -R webdeploy:www-data $WEB_ROOT
sudo chmod -R 770 $WEB_ROOT

# 3. 设置文件权限（660：所有者+组可读写）
find $WEB_ROOT -type f -exec sudo chmod 660 {} \;

# 4. 验证权限
ls -la /var/www
ls -la $WEB_ROOT
```

**验证ChrootDirectory要求：**

```bash
# 检查/var/www所有者（必须是root）
ls -ld /var/www
# 应该显示：drwxr-xr-x  root root

# 检查/var/www权限（最大755）
stat -c %a /var/www
# 应该显示：755

# 检查/var/www/html所有者（应该是webdeploy:www-data）
ls -ld /var/www/html
# 应该显示：drwxrwx---  webdeploy www-data
```

## 二、SSH安全配置

### 2.1 禁止root登录

编辑SSH配置文件：

```bash
sudo nano /etc/ssh/sshd_config
```

添加或修改以下配置：

```bash
# 禁止root用户登录
PermitRootLogin no

# 禁用密码认证（全局）
PasswordAuthentication no

# 启用公钥认证
PubkeyAuthentication yes

# 指定认证方法
AuthenticationMethods publickey

# 指定授权密钥文件
AuthorizedKeysFile .ssh/authorized_keys
```

### 2.2 配置webdeploy用户SFTP访问

在 `/etc/ssh/sshd_config` 文件末尾添加：

```bash
# webdeploy用户配置
Match User webdeploy
    # 允许密码认证
    AuthenticationMethods password
    PasswordAuthentication yes
    PubkeyAuthentication no
    
    # 限制为SFTP
    ForceCommand internal-sftp
    
    # 限制访问目录（必须是root:root, 755）
    ChrootDirectory /var/www
    
    # 禁用端口转发
    AllowTcpForwarding no
    
    # 禁用X11转发
    X11Forwarding no
```

**注意：**
- ChrootDirectory设置为 `/var/www`（不是 `/var/www/html`）
- `/var/www` 必须是 `root:root` 所有者，权限755
- `/var/www/html` 是用户可写目录，`webdeploy:www-data` 所有者，权限770
- 用户登录后会看到 `/html` 作为根目录

### 2.3 验证SSH配置

```bash
# 测试配置文件语法
sudo sshd -t

# 重启SSH服务
sudo systemctl restart sshd

# 查看SSH服务状态
sudo systemctl status sshd
```

### 2.4 测试登录

#### 测试管理员账户（密钥登录）

```bash
# 使用密钥登录
ssh admin@your-server-ip

# 应该能成功登录
```

#### 测试webdeploy用户（密码登录）

```bash
# 使用SFTP连接
sftp webdeploy@your-server-ip

# 输入密码
# 应该能成功连接，但只能访问 /html 目录（实际是/var/www/html）
```

## 三、Fail2ban配置

### 3.1 安装Fail2ban

```bash
# 更新软件包列表
sudo apt update

# 安装fail2ban
sudo apt install fail2ban

# 复制配置文件
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 启动服务
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 3.2 配置SSH保护

编辑配置文件：

```bash
sudo nano /etc/fail2ban/jail.local
```

添加以下配置：

```bash
[DEFAULT]
# 白名单IP
ignoreip = 127.0.0.1/8 ::1 <你的公网IP>

# 封禁时间（秒）
bantime = 3600

# 最大重试次数
maxretry = 5

# 时间窗口（秒）
findtime = 600

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
```

### 3.3 管理Fail2ban

#### 查看状态

```bash
# 查看所有jail状态
sudo fail2ban-client status

# 查看sshd jail状态
sudo fail2ban-client status sshd

# 查看被封禁的IP
sudo fail2ban-client banned sshd
```

#### 解禁IP

```bash
# 解禁特定IP
sudo fail2ban-client set sshd unbanip <IP地址>

# 解禁所有IP
sudo fail2ban-client set sshd unbanip all
```

#### 查看日志

```bash
# 查看fail2ban日志
sudo tail -f /var/log/fail2ban.log

# 查看SSH认证失败日志
sudo grep "Failed" /var/log/auth.log | tail -20
```

### 3.4 临时禁用Fail2ban（用于测试）

```bash
# 停止fail2ban服务
sudo systemctl stop fail2ban

# 测试webdeploy登录
sftp webdeploy@your-server-ip

# 测试完成后重新启动
sudo systemctl start fail2ban
```

## 四、Nginx配置

### 4.1 确认Nginx用户

```bash
# 查看nginx运行用户
ps aux | grep nginx

# 或查看配置文件
grep "user" /etc/nginx/nginx.conf

# Ubuntu 22.04默认为：www-data
```

### 4.2 配置网站目录

```bash
# 1. 创建网站目录结构
sudo mkdir -p /var/www/html

# 2. 设置/var/www目录（ChrootDirectory要求）
# 所有者必须是root，权限755
sudo chown root:root /var/www
sudo chmod 755 /var/www

# 3. 设置/var/www/html目录（用户可写）
# 所有者webdeploy:www-data，权限770
sudo chown -R webdeploy:www-data /var/www/html
sudo chmod -R 770 /var/www/html

# 4. 设置文件权限（660：所有者+组可读写）
find /var/www/html -type f -exec sudo chmod 660 {} \;

# 5. 验证权限
ls -la /var/www
ls -la /var/www/html
```

**目录结构验证：**

```bash
# 应该看到：
# /var/www: drwxr-xr-x  root root
# /var/www/html: drwxrwx---  webdeploy www-data
```

### 4.3 Nginx基本配置

```nginx
# /etc/nginx/sites-available/default

server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 4.4 重启Nginx

```bash
# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

## 五、安全检查清单

### 5.1 用户权限检查

- [ ] root用户禁止SSH登录
- [ ] 常用账户已加入sudo组
- [ ] webdeploy用户shell设置为nologin
- [ ] webdeploy用户属于www-data组
- [ ] 网站目录权限为770
- [ ] 网站文件权限为660

### 5.2 SSH安全检查

- [ ] 禁用密码认证（全局）
- [ ] 启用公钥认证
- [ ] 设置AuthenticationMethods为publickey
- [ ] webdeploy用户允许密码登录
- [ ] webdeploy用户限制为SFTP
- [ ] webdeploy用户chroot到网站目录

### 5.3 Fail2ban检查

- [ ] Fail2ban已安装并运行
- [ ] SSH jail已启用
- [ ] 白名单IP已配置
- [ ] 封禁参数已调整

### 5.4 Nginx检查

- [ ] Nginx服务运行正常
- [ ] 网站目录权限正确
- [ ] Nginx可以读取网站文件

## 六、故障排查

### 6.1 SSH连接失败

```bash
# 查看SSH日志
sudo tail -f /var/log/auth.log

# 检查SSH服务状态
sudo systemctl status sshd

# 检查防火墙
sudo ufw status
```

### 6.2 网站无法访问

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查文件权限
ls -la /var/www/html
```

### 6.3 SFTP连接失败

```bash
# 检查fail2ban是否封禁IP
sudo fail2ban-client status sshd

# 检查用户密码
sudo passwd -S webdeploy

# 查看SSH配置
sudo sshd -T | grep -A 10 "Match User webdeploy"
```

## 七、维护建议

### 7.1 定期更新

```bash
# 更新系统
sudo apt update
sudo apt upgrade

# 更新fail2ban
sudo apt install --only-upgrade fail2ban
```

### 7.2 监控日志

```bash
# 定期检查SSH日志
sudo grep "Failed password" /var/log/auth.log | tail -50

# 定期检查fail2ban日志
sudo tail -100 /var/log/fail2ban.log
```

### 7.3 备份配置

```bash
# 备份SSH配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# 备份fail2ban配置
sudo cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local.backup

# 备份网站文件
sudo tar -czf /backup/website-$(date +%Y%m%d).tar.gz /var/www/html
```

## 八、参考资料

- [OpenSSH官方文档](https://www.openssh.com/manual.html)
- [Fail2ban官方文档](https://fail2ban.readthedocs.io/)
- [Nginx官方文档](https://nginx.org/en/docs/)
