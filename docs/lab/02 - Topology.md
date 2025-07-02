---
title: The Lab's Topology
subtitle: John gives us a very brief tour.
---

The Lab's network is indeed ever changing. The CIO throws money at us for hardware, but rarely ever budgets time for software maintenance or security reviews. Until I made this network topology, nobody had ever run a network scan. Mind you, this was made on a Friday afternoon so it's really a "point in time" map...

```
<<+------------+------------------------+-------+--------------+
| PROXMOX ID |        VM NAME         | POWER |      IP      |
+------------+------------------------+-------+--------------+
|    107     | jt-router-debian11-x64 |  On   | 10.2.20.254  |
|    108     | jt-svr22-01            |  On   | 10.2.20.3    |
|    109     | jt-splunk              |  On   | 10.2.20.1    |
|    110     | jt-w11-01              |  On   | 10.2.20.4    |
|    111     | jt-ub-01               |  On   | 10.2.20.50   |
|    112     | jt-kali                |  On   | 10.2.100.100 |
|    113     | jt-rustdesk            |  On   | 10.2.100.200 |
|    114     | jt-elastic             |  On   | 10.2.20.2    |
+------------+------------------------+-------+--------------+>>
```

!!! question "What's Proxmox?"
    Proxmox is a virtualization software, like VMware. Proxmox assigns IDs to each virtual machine. The IDs rarely change, and *can* be a good way to track devices even if their IPs change.

The `10.2.20.0/24` subnet is where almost everything lives. You'll see workstations come and go as employees do.

- Before we went our separate ways, we got the MSSP to set up Elastic. I don't think it's ready for prime time yet. I don't know if anyone's reviewing the alerts. I guess you could.
- We use `ub-01` as a data analytics server, most people have access, but I know Gregory was using it for something too. Volcano...? Whatever that is.
- As you asked, I made `10.2.20.55` and named it `velociraptor`. Do with it what you want to.

I made this `10.2.100.0/24` subnet to isolate the guest WiFi but the isolation isn't exactly what I was hoping for. I need to do some more work on it. I also join any new hardware I'm testing, like phones or new Microsoft tablets, to this WiFi before I set them up with our software!

A firewall, you ask...? Well we don't have anything open to the internet, so I never really set much of one up. `10.2.20.254` has some basic firewall capabilities, like blocking domains, but it's really not a firewall. Maybe we should set one up.

Anyway, your credentials are below. They're the same for every new hire, so don't go logging into someone else's account! Mr. Luckus asked me to have you prioritize fixing that.

```
User: lskiwalker
Password: password

Admin user: admlskiwalker
Password: password
```

---

## Building the Lab: Ludus

My homelab, aka "The Lab" (okay, maybe I need to work on the name) is built with [Ludus](https://docs.ludus.cloud). It's using several `roles` but perhaps most central is the [Splunk attack range](https://docs.ludus.cloud/docs/environment-guides/splunk-attack-range/) *role*. It's very similar to the standalone [Splunk attack range](https://github.com/splunk/attack_range) project.

The linked documents will get you very far. The process looks something like this:

- SSH into the Ludus server (`ssh user@@192.168.10.10`)
- Set API key: `export LUDUS_API_KEY='here'`
- Add the roles:

```bash
ludus ansible roles add p4t12ick.ludus_ar_splunk
ludus ansible roles add p4t12ick.ludus_ar_windows
ludus ansible roles add p4t12ick.ludus_ar_linux
```

- Build the Ubuntu **22**.04 template:

```bash
git clone https://gitlab.com/badsectorlabs/ludus
cd ludus/templates
ludus templates add -d ubuntu-22.04-x64-server
ludus templates build
# Wait until the templates finish building, you can monitor them with 
# `ludus templates logs -f` or `ludus templates status`
```

- Assign the `p4t12ick.ludus_ar_splunk` role to an **Ubuntu** VM to **HOST** Splunk
- `p4t12ick.ludus_ar_windows` 
- `p4t12ick.ludus_ar_linux` for Linux clients

The deployment usually looks something like this:

- `ludus range config set -f myconfig.yml`
- `ludus range deploy` && `ludus range logs -f` to keep an eye on it
- If/when something goes wrong, `ludus range deploy -t user-defined-roles`
- `ludus range deploy -t share`

Repeating the `user-defined-roles` line is often required. If one host is giving me particular problems, I can exclude it by using `ludus range deploy -t user-defined-roles --limit <comma separated hosts EXCLUDING the problem host>`.

### Lab Config

The latest version of my lab configuration is [here](https://gist.github.com/droidforensics/c47ccef0d5366ec02fef923e79d983b9).

Additional tweaks are described below.

### Bad Blood

[Bad Blood](https://github.com/davidprowe/BadBlood) runs. The values are randomized.

### Sysmon Changes

I'm using various editions of [Sysmon Modular](https://github.com/olafhartong/sysmon-modular) instead of SwiftOnSecurity's config that Attack Range ships with.

### Enhanced Logging

Multiple components of Ludus enhance logging (e.g., the Attack Range role modifies Powershell logging), but I've added yet another layer. [This script from Yamato-Security](https://github.com/Yamato-Security/EnableWindowsLogSettings/blob/main/YamatoSecurityConfigureWinEventLogs.bat) acts as my "main" configuration.

Windows systems should have *at least* this configuration, regardless of being domain joined or not. Anything over-and-beyond is great, but this is the baseline.

I made the following changes from the script linked above:

```batch
:: Sysmon can be just over 16GB
wevtutil sl Microsoft-Windows-Sysmon/Operational /ms:17179869184

:: No other changes at this time
```

### Disabling Defender

I have yet to learn how to be a hacker at all, let alone one that can bypass or tamper with Defender. For now, I disable it via GPO (on top of the Ludus `disable-defender` GPO seen in the config. The Ludus one doesn't seem to work 100% of the time? That's *very possibly* a me thing, though).

- Computer Configuration -> Policies -> Administrative Templates -> Windows Components -> `Microsoft Defender Antivirus`
  - `Turn off Microsoft Defender Antivirus`: **Enabled**
  - `Turn off routine remediation`: **Enabled**
  - `Real-Time Protection` subfolder:
    - `Turn off real-time protection`: **Enabled**
    - `Turn on script scanning`: **Disabled**
    - `Turn on behavior monitoring`: **Disabled**
    - `Scan all downloaded files and attachments`: **Disabled**
  - `Exclusions` subfolder:
    - `Path Exclusions`: **Enabled**
      - Add `C:\` as an exception. Value name: `C:\` and value: `0`

### Various Powershell Tweaks

- Computer Configuration -> Policies -> Administrative Templates -> Windows Components -> Windows Powershell
  - `Turn on module logging`: **Enabled**
    - Set `*` as the module name(s) to track
  - `Turn on PowerShell Script Block Logging`: **Enabled**
    - Check `Log script block invocation start/stop events`
  - `Turn on Script Execution`: **Enabled**
    - Set preferred policy
  - `Turn on Powershell Transcription`: **Enabled**
    - Transcript output directory: `C:\PowershellTranscripts` or preferred
    - Check `include invocation headers`

### Multiple RDP Users Logged in at Once

Without this, there's a 60s waiting period when you RDP in and someone else is logged in. It prompts them to confirm/deny before kicking *them* after 60s, so you can get in.

- Computer Configuration -> Policies -> Administrative Templates -> Windows Components -> Remote Desktop Services -> Remote Desktop Session Host -> Connections
  - `Restrict Remote Desktop Services user to a single Remote Desktop Services`: **Disabled**
  - `Limit number of connections`: `999999`

### Network Shares

There are (at least) three network shares:

- `readonlyshare` 
- `readwriteshare`
- `labratoryshare`

The first two are convenience shares that [Ludus provides](https://docs.ludus.cloud/docs/file-share/). They won't be used for malice, but will be used for convenience/centralization of resources. On the other hand, `labratoryshare` is "in scope" for our adversary.

!!! tip
    For a "lore-friendly" explanation, we can assume the adversary never found out about the `read` shares, or they had no interest in them.

The `read` shares have, among other things:

- A Velociraptor offline collector doing KAPE triage collections
- Sysmon binaries + config files
- Misc. installers
