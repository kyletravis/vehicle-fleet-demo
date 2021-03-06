Vagrant.configure("2") do |config|
  config.vm.box = "micropcf/micropcf"
  config.vm.box_version = "0.14.0"

  config.vm.synced_folder ".", "/vagrant", disabled: true

  vagrant_up = (!ARGV.nil? && ARGV.first == 'up')
  vagrant_up_aws = (vagrant_up && ARGV.join(' ').match(/provider(=|\s+)aws/))

  if Vagrant.has_plugin?("vagrant-proxyconf") && !vagrant_up_aws
    config.proxy.http = ENV["http_proxy"] || ENV["HTTP_PROXY"]
    config.proxy.https = ENV["https_proxy"] || ENV["HTTPS_PROXY"]
    config.proxy.no_proxy = [
      "localhost", "127.0.0.1",
      (ENV["MICROPCF_IP"] || "192.168.11.11"),
      (ENV["MICROPCF_DOMAIN"] || "local.micropcf.io")
    ].join(',')
  end

  resources = calculate_resource_allocation
  if resources[:memory] == 2048 && vagrant_up && !vagrant_up_aws
    puts "WARNING: MicroPCF has reserved 2 GBs out of #{resources[:max_memory] / 1024} GBs total system memory."
    puts "Performance may be impacted."
  end

  config.vm.provider "virtualbox" do |v|
    v.customize ["modifyvm", :id, "--memory", resources[:memory]]
    v.customize ["modifyvm", :id, "--cpus", resources[:cpus]]
    v.customize ["modifyvm", :id, "--ioapic", "on"]
  end

  config.vm.provider "vmware_fusion" do |v|
    v.vmx["memsize"] = resources[:memory]
    v.vmx["numvcpus"] = resources[:cpus]
  end

  config.vm.provider "vmware_workstation" do |v|
    v.vmx["memsize"] = resources[:memory]
    v.vmx["numvcpus"] = resources[:cpus]
  end

  config.vm.provider "aws" do |aws, override|
    aws.access_key_id = ENV["AWS_ACCESS_KEY_ID"]
    aws.secret_access_key = ENV["AWS_SECRET_ACCESS_KEY"]
    aws.keypair_name = ENV["AWS_SSH_PRIVATE_KEY_NAME"]
    aws.region = ENV["AWS_REGION"] || 'us-east-1'
    aws.instance_type = "m4.large"
    aws.ebs_optimized = true
    aws.tags = { "Name" => (ENV["AWS_INSTANCE_NAME"] || "micropcf") }
    aws.ami = ""

    override.ssh.username = "ubuntu"
    override.ssh.private_key_path = ENV["AWS_SSH_PRIVATE_KEY_PATH"]
  end

  local_public_ip = ENV["MICROPCF_IP"] || "192.168.11.11"
  local_default_domain = (local_public_ip == "192.168.11.11") ? "local.micropcf.io" : "#{local_public_ip}.xip.io"
  if !vagrant_up_aws
    config.vm.network "private_network", ip: local_public_ip
  end

  config.vm.provision "shell", run: "always" do |s|
    cf_cli_present = system("which cf > /dev/null")
    s.inline = <<-SCRIPT
      set -e
      if public_ip="$(curl -m 2 -s http://169.254.169.254/latest/meta-data/public-ipv4)"; then
        domain="#{ENV["MICROPCF_DOMAIN"] || "${public_ip}.xip.io"}"
      else
        domain="#{ENV["MICROPCF_DOMAIN"] || local_default_domain}"
      fi
      /var/micropcf/run "$domain"
      #{cf_cli_present} || echo "Don't have the cf command line utility? Download it from https://github.com/cloudfoundry/cli/releases"
    SCRIPT
  end

end


def calculate_resource_allocation
  cpus = ENV['VM_CORES'] ? ENV['VM_CORES'].to_i : nil
  memory = ENV['VM_MEMORY'] ? ENV['VM_MEMORY'].to_i : nil

  case RUBY_PLATFORM
  when /darwin/i
    cpus ||= `sysctl -n hw.ncpu`.to_i
    max_memory = `sysctl -n hw.memsize`.to_i / 1024 / 1024
  when /linux/i
    cpus ||= `nproc`.to_i
    max_memory = `grep 'MemTotal' /proc/meminfo | sed -e 's/MemTotal://' -e 's/ kB//'`.to_i / 1024
  when /cygwin|mswin|mingw|bccwin|wince|emx/i
    cpus ||= `wmic computersystem get numberoflogicalprocessors`.split("\n")[2].to_i
    max_memory = `wmic OS get TotalVisibleMemorySize`.split("\n")[2].to_i / 1024
  else
    cpus ||= 2
    max_memory = 8192
  end

  memory ||= [[2048, max_memory / 2].max, 8192].min

  {memory: memory / 4 * 4, cpus: cpus, max_memory: max_memory}
end
